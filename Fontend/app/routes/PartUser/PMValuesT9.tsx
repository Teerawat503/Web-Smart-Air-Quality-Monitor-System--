import React, { useEffect, useState, useRef } from 'react';
import { useParams } from '@remix-run/react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

Chart.register(...registerables);

const PMValuesT9 = () => {
  const { pmId } = useParams();
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedPM, setSelectedPM] = useState('PM2_5'); // PM type: PM2_5, PM10, or PM1
  const [viewType, setViewType] = useState('hour'); // 'hour' or 'day'
  const chartRef = useRef(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const url = pmId
        ? `http://localhost:3005/api/getHistory/${pmId}`
        : 'http://localhost:3005/api/getHistory';
      const response = await fetch(url);
      const json = await response.json();

      const formattedData = json
        .map((row) => ({
          timestamp: row.timestamp,
          pm2_5: row.PM2_5,
          pm1: row.PM1,
          pm10: row.PM10,
          sensorStatus: row.sensorStatus,
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setData(formattedData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group the data based on the selected view and PM type,
  // and calculate the average for each group.
  useEffect(() => {
    if (data.length > 0) {
      // Optionally filter by date range if startDate/endDate are provided:
      let filteredData = data;
      if (startDate) {
        filteredData = filteredData.filter(
          (row) => new Date(row.timestamp) >= startDate
        );
      }
      if (endDate) {
        filteredData = filteredData.filter(
          (row) => new Date(row.timestamp) <= endDate
        );
      }

      // Group data by hour or day and calculate the average.
      const groupMap = {};

      filteredData.forEach((row) => {
        const date = new Date(row.timestamp);
        let groupKey;
        if (viewType === 'hour') {
          // Group by hour: reset minutes, seconds, and ms.
          date.setMinutes(0, 0, 0);
          groupKey = date.toISOString();
        } else if (viewType === 'day') {
          // Group by day: reset hours, minutes, seconds, and ms.
          date.setHours(0, 0, 0, 0);
          groupKey = date.toISOString();
        }

        if (!groupMap[groupKey]) {
          groupMap[groupKey] = { sum: 0, count: 0 };
        }

        let value;
        if (selectedPM === 'PM2_5') {
          value = row.pm2_5;
        } else if (selectedPM === 'PM10') {
          value = row.pm10;
        } else if (selectedPM === 'PM1') {
          value = row.pm1;
        }

        groupMap[groupKey].sum += value;
        groupMap[groupKey].count += 1;
      });

      // Sort the group keys so that the data is chronological.
      const sortedKeys = Object.keys(groupMap).sort();
      const labels = sortedKeys.map((key) =>
        new Date(key).toLocaleString()
      );
      const averagedData = sortedKeys.map(
        (key) => groupMap[key].sum / groupMap[key].count
      );

      setChartData({
        labels,
        datasets: [
          {
            label: `${selectedPM} Average (${viewType === 'hour' ? 'Per Hour' : 'Per Day'})`,
            data: averagedData,
            // Map each bar's border and background color based on its value.
            borderColor: averagedData.map((val) => getPMColor(val)),
            backgroundColor: averagedData.map((val) => getPMColor(val, 0.3)),
            borderWidth: 1,
          },
        ],
      });
    }
  }, [data, selectedPM, viewType, startDate, endDate]);

  const getPMColor = (value, opacity = 1) => {
    if (value <= 25) return `rgba(34, 197, 94, ${opacity})`; // Green
    if (value <= 37.5) return `rgba(234, 179, 8, ${opacity})`; // Yellow
    if (value <= 75) return `rgba(249, 115, 22, ${opacity})`; // Orange
    return `rgba(220, 38, 38, ${opacity})`; // Red
  };

  const resetDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-4">
          <svg
            className="animate-spin h-12 w-12 text-black"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z"
            ></path>
          </svg>
          <span className="text-black text-lg font-semibold">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-600 text-xl">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      {/* Updated heading with more contrasting text color */}
      <h2 className="text-3xl font-bold text-black mb-6">
        PM2.5, PM10, and PM1 Data Visualization
      </h2>

      <div className="flex gap-4 mb-6 items-end">
        {/* Date Pickers for Start/End Date */}
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          dateFormat="yyyy-MM-dd"
          className="p-2 border border-gray-600 rounded-md shadow-sm"
          placeholderText="Select start date"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          dateFormat="yyyy-MM-dd"
          className="p-2 border border-gray-600 rounded-md shadow-sm"
          placeholderText="Select end date"
        />
        {/* Reset Date Button */}
        <button
          onClick={resetDates}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none transition duration-300"
        >
          Reset Date
        </button>
      </div>

      {/* Dropdown for selecting PM type */}
      <div className="mb-6">
        <select
          value={selectedPM}
          onChange={(e) => setSelectedPM(e.target.value)}
          className="border p-2 rounded-lg text-lg shadow-md focus:ring-2 focus:ring-black"
        >
          <option value="PM2_5">PM2.5 Levels</option>
          <option value="PM10">PM10 Levels</option>
          <option value="PM1">PM1 Levels</option>
        </select>
      </div>

      <div className="flex gap-4 mb-6">
        {/* Buttons for selecting view type */}
        <button
          onClick={() => setViewType('hour')}
          className={`bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none transition duration-300 ${
            viewType === 'hour' ? 'ring-2 ring-black' : ''
          }`}
        >
          View Hourly
        </button>
        <button
          onClick={() => setViewType('day')}
          className={`bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none transition duration-300 ${
            viewType === 'day' ? 'ring-2 ring-black' : ''
          }`}
        >
          View Daily
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
        {chartData ? (
          <Bar
            ref={chartRef}
            data={chartData}
            options={{ responsive: true, maintainAspectRatio: false }}
            height={400}
          />
        ) : (
          <p className="text-gray-700 text-center">Loading chart...</p>
        )}
      </div>
    </div>
  );
};

export default PMValuesT9;
