import React, { useEffect, useState, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";  
import { registerLocale } from 'react-datepicker';
import th from 'date-fns/locale/th'; // นำเข้า locale ภาษาไทย
import { BiBorderRadius } from 'react-icons/bi';

Chart.register(...registerables);

if (typeof window !== 'undefined') {
  // ใช้ registerLocale เฉพาะเมื่ออยู่ในฝั่ง client
  registerLocale('th', th);
}

const IOTGPY2024 = () => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [averagePM25, setAveragePM25] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(null); // For displaying selected label (day/hour)
  const [selectedAveragePM25, setSelectedAveragePM25] = useState(null); // For displaying selected average PM2.5 value
  const [viewType, setViewType] = useState('hour'); // 'hour' or 'day'
  const chartRef = useRef(null);

  // Function to fetch data from the remote source.
  const fetchData = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbzedteL-n4Yd_Vi2lb3GvqNVyi6aTb1finwVMSgy6GjJT_suRMqLe6ZHTfXJVES0JdsJQ/exec'
      );
      const json = await response.json();
      const formattedData = json.map((row) => ({
        pmId: "IOTGPY2024",
        timestamp: row[0], // timestamp is the first field
        pm2_5: row[2],     // pm2_5 is the third field
      }));
      setData(formattedData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data.');
      setIsLoading(false);
    }
  };

  // Initial fetch and then re-fetch every 10 seconds for real-time updates.
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10 seconds interval
    return () => clearInterval(interval);
  }, []);

  // Process and group data whenever the raw data, date range, or view type changes.
  useEffect(() => {
    if (data.length > 0) {
      // Filter data by date range and also filter out rows with invalid dates.
      const filteredData = data.filter((row) => {
        const rowDate = new Date(row.timestamp);
        if (isNaN(rowDate.getTime())) return false;
        const isDateInRange =
          (!startDate || rowDate >= new Date(startDate)) &&
          (!endDate || rowDate <= new Date(endDate));
        return isDateInRange;
      });
  
      let groupedData;
      if (viewType === 'hour') {
        groupedData = groupByHour(filteredData);
      } else if (viewType === 'day') {
        groupedData = groupByDay(filteredData);
      }
  
      const labels = groupedData.map((item) => item.label);
      const pm2_5Data = groupedData.map((item) => item.averagePM25);
  
      // Remove any invalid data points
      const validData = pm2_5Data.filter((value) => !isNaN(value));
  
      const colors = validData.map((value) => getSafetyColor(value));
  
      const avgPM25 =
        validData.length > 0
          ? validData.reduce((acc, value) => acc + value, 0) / validData.length
          : null;
      setAveragePM25(avgPM25);
  
      setChartData({
        labels,
        datasets: [
          {
            label: 'PM2.5 Data',
            data: validData, // Use filtered valid data
            backgroundColor: colors,
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            borderRadius: 1000,
            barThickness: 10,
            hoverBackgroundColor: 'rgba(0, 0, 0, 0.5)',
            type: 'bar',
          },
        ],
      });
    }
  }, [data, startDate, endDate, viewType]);

  // Grouping functions.
  const groupByHour = (data) => {
    const groups = {};
    data.forEach((row) => {
      const date = new Date(row.timestamp);
      // Skip row if the date is invalid
      if (isNaN(date.getTime())) return;
      const hour = date.getHours();
      // Create a key like "15-8 เวลา 14:00"
      const dateKey = `${date.getDate()}-${date.getMonth() + 1} เวลา ${hour}:00`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(row.pm2_5);
    });

    return Object.keys(groups).map((key) => {
      const values = groups[key];
      const averagePM25 = values.reduce((acc, value) => acc + value, 0) / values.length;
      return { label: key, averagePM25 };
    });
  };

  const groupByDay = (data) => {
    const groups = {};
    data.forEach((row) => {
      const date = new Date(row.timestamp);
      // Skip row if the date is invalid
      if (isNaN(date.getTime())) return;
      const dateKey = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(row.pm2_5);
    });

    return Object.keys(groups).map((key) => {
      const values = groups[key];
      const averagePM25 = values.reduce((acc, value) => acc + value, 0) / values.length;
      return { label: key, averagePM25 };
    });
  };

  // Returns a color based on the PM2.5 value.
  const getSafetyColor = (pm25) => {
    if (pm25 <= 25) {
      return 'rgba(76, 175, 80, 0.7)'; // Green for good
    } else if (pm25 <= 37.5) {
      return 'rgba(255, 193, 7, 0.7)'; // Yellow for moderate
    } else if (pm25 <= 75.0) {
      return 'rgba(255, 87, 34, 0.7)'; // Orange for unhealthy
    } else {
      return 'rgba(241, 20, 4, 0.7)'; // Red for very unhealthy
    }
  };

  // Handler for changing the view type.
  const handleViewChange = (e) => {
    setViewType(e.target.value); // Change view type between 'hour' and 'day'
  };

  // When a bar in the chart is clicked, update the selected label and PM2.5 value.
  const handleChartClick = (event, chartElement) => {
    if (chartElement.length > 0) {
      const index = chartElement[0].index;
      const label = chartData.labels[index];
      const averagePM25 = chartData.datasets[0].data[index];
  
      if (!isNaN(averagePM25)) {
        setSelectedLabel(label);
        setSelectedAveragePM25(averagePM25);
      }
    }
  };

  // Render average PM2.5 as a formatted string.
  const renderAveragePM25 = (averagePM25) => {
    return !isNaN(averagePM25) && averagePM25 !== null
      ? `${averagePM25.toFixed(2)} µg/m³`
      : 'No Data'; // Use 'No Data' if the value is invalid
  };

  // Reset date function to clear both start and end dates.
  const resetDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-4">
          <svg
            className="animate-spin h-12 w-12 text-indigo-500"
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
          <span className="text-indigo-600 text-lg font-semibold">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 text-xl">{error}</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl bg-white shadow-xl rounded-xl">
      <h2 className="text-4xl font-semibold text-center mb-6 text-gray-800">PM2.5 Graph (Realtime)</h2>

      {/* Date Picker Section with Reset Button */}
      <div className="mb-8 flex justify-center items-end space-x-4">
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          dateFormat="yyyy-MM-dd"
          className="p-2 border border-gray-300 rounded-md shadow-sm"
          placeholderText="Select start date"
          locale="th" // กำหนดให้แสดงเดือนและปีเป็นภาษาไทย
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          dateFormat="yyyy-MM-dd"
          className="p-2 border border-gray-300 rounded-md shadow-sm"
          placeholderText="Select end date"
          locale="th" // กำหนดให้แสดงเดือนและปีเป็นภาษาไทย
        />
        <button
          onClick={resetDates}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none transition duration-300"
        >
          Reset Date
        </button>
      </div>

      {/* View Type Buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={handleViewChange}
          value="hour"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none transition duration-300"
        >
          View Hourly
        </button>
        <button
          onClick={handleViewChange}
          value="day"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none transition duration-300"
        >
          View Daily
        </button>
      </div>

      {/* Selected Data */}
      {selectedLabel && selectedAveragePM25 !== null && (
        <div className="mt-4 bg-red-100 border-l-4 border-red-500 shadow-lg rounded-lg p-6">
          <h3 className="text-xl font-semibold">
            Selected {viewType === 'hour' ? 'Hour' : 'Day'}: {selectedLabel}
          </h3>
          <p className="text-lg">Average PM2.5: {renderAveragePM25(selectedAveragePM25)}</p>
        </div>
      )}

      {/* Chart */}
      {chartData && (
        <div className="bg-white shadow-xl rounded-lg p-8 mt-6">
          <Bar
            ref={chartRef}
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              onClick: handleChartClick,
              tooltips: {
                callbacks: {
                  label: function (tooltipItem) {
                    return `${tooltipItem.xLabel}: ${tooltipItem.yLabel} µg/m³`;
                  },
                },
              },
              scales: {
                x: {
                  grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)',
                  },
                },
                y: {
                  grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)',
                  },
                  ticks: {
                    beginAtZero: true,
                    stepSize: 10,
                  },
                },
              },
            }}
            height={300}
          />
        </div>
      )}
    </div>
  );
};

export default IOTGPY2024;
