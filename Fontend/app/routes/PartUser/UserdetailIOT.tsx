import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSmog, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2'; // Import Bar chart component
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register the required chart components for Bar chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function UserDetailIOT() {
  const [iotData, setIotData] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphVisibility, setGraphVisibility] = useState<any>({}); // Track visibility for each pmId
  const [selectedPMMap, setSelectedPMMap] = useState<any>({});
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch IoT data
        const response = await axios.get('http://localhost:3005/api/getIoTData');
        const filteredData = response.data.filter(
          (data: any) => data.pmId && data.status !== 'inactive' // Ensure pmId exists and status is not 'inactive'
        );
        setIotData(filteredData);
        setLoading(false);

        // Fetch historical data for each IoT device based on pmId
        const historyPromises = filteredData.map(async (data: any) => {
          const historyResponse = await axios.get(`http://localhost:3005/api/getHistory/${data.pmId}`);
          return { pmId: data.pmId, history: historyResponse.data };
        });

        const historyResults = await Promise.all(historyPromises);
        const historyMap: any = {};
        historyResults.forEach((item: any) => {
          historyMap[item.pmId] = item.history;
        });
        setHistoryData(historyMap);

      } catch (err) {
        console.error('Error fetching IoT data:', err);
        setError('ไม่สามารถดึงข้อมูล IoT ได้');
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <h2 className="text-2xl font-semibold text-indigo-600">กำลังโหลดข้อมูล...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <h2 className="text-2xl font-semibold text-red-600">{error}</h2>
      </div>
    );
  }
  const prepareHistoryChartData = (history: any[], selectedPM: string) => {
    const now = new Date();
    // Filter records within the last 24 hours
    const last24Hours = history.filter(record => {
      const recordDate = new Date(record.timestamp);
      return now.getTime() - recordDate.getTime() <= 24 * 60 * 60 * 1000;
    });
    // Sort records in ascending order by timestamp
    last24Hours.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    // Use the hour of each record as the label (e.g., "14:00")
    const labels = last24Hours.map(record => {
      const date = new Date(record.timestamp);
      return `${date.getHours()}:00`;
    });
    const dataValues = last24Hours.map(record => record[selectedPM] || 0);

    return {
      labels,
      datasets: [
        {
          label: selectedPM,
          data: dataValues,
          backgroundColor:
            selectedPM === "PM1" ? '#34D399' :
            selectedPM === "PM10" ? '#FBBF24' : '#F87171',
          borderColor:
            selectedPM === "PM1" ? '#34D399' :
            selectedPM === "PM10" ? '#FBBF24' : '#F87171',
          borderWidth: 2,
        }
      ]
    };
  };

  const getColors = (pmValue: number) => {
    if (pmValue <= 25) {
      return {
        backgroundColor: 'bg-green-200',
        fontColor: 'text-green-800',
        iconColor: 'text-green-500'
      };
    } else if (pmValue > 25 && pmValue < 37.6) {
      return {
        backgroundColor: 'bg-yellow-200',
        fontColor: 'text-yellow-800',
        iconColor: 'text-yellow-500'
      };
    } else if (pmValue > 37.6 && pmValue < 75.0) {
      return {
        backgroundColor: 'bg-orange-200',
        fontColor: 'text-orange-800',
        iconColor: 'text-orange-500'
      };
    } else {
      return {
        backgroundColor: 'bg-red-200',
        fontColor: 'text-red-800',
        iconColor: 'text-red-500'
      };
    }
  };

  const prepareChartData = (data: any) => {
    return {
      labels: ['PM1', 'PM10', 'PM2.5'],
      datasets: [
        {
          label: 'PM1',
          data: [data.PM1 || 0, 0, 0],
          backgroundColor: '#34D399',
          borderColor: '#34D399',
          borderWidth: 2,
        },
        {
          label: 'PM10',
          data: [0, data.PM10 || 0, 0],
          backgroundColor: '#FBBF24',
          borderColor: '#FBBF24',
          borderWidth: 2,
        },
        {
          label: 'PM2.5',
          data: [0, 0, data.PM2_5 || 0],
          backgroundColor: '#F87171',
          borderColor: '#F87171',
          borderWidth: 2,
        },
      ],
    };
  };

  // Toggle graph visibility
  const toggleGraph = (pmId: string) => {
    setGraphVisibility((prevState: any) => ({
      ...prevState,
      [pmId]: !prevState[pmId],
    }));
  };

  // Handle selection of PM parameter for a device's chart
  const handleSelectPM = (pmId: string, param: string) => {
    setSelectedPMMap((prevState: any) => ({
      ...prevState,
      [pmId]: param,
    }));
  };

  // Filter out any device that doesn't have a pmId (already filtered earlier, but just in case)
  const devicesWithPmId = iotData.filter((data: any) => data.pmId);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-semibold text-indigo-600 text-center mb-8">
        คุณภาพอากาศ RMUTTO
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
        {devicesWithPmId.map((data, index) => {
          const pm2_5 = data.PM2_5 || 0;
          const { backgroundColor, fontColor, iconColor } = getColors(pm2_5);
          // Use the selected PM parameter for this device; default to "PM2_5"
          const selectedPM = selectedPMMap[data.pmId] || "PM2_5";
          // Get history data for this device if available
          const deviceHistory = historyData[data.pmId] || [];

          return (
            <div key={index} className={`rounded-lg shadow-lg p-6 space-y-4 text-gray-800 ${backgroundColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold ${fontColor}`}>สถานที่: {data.address}</h2>
                  <p className="text-sm text-gray-500">
                    สถานะ: <span className={`font-medium ${iconColor}`}>{data.status || 'ปานกลาง'}</span>
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${iconColor}`}>
                  <FaSmog size={24} />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-gray-700 text-sm font-medium">สารมลพิษหลัก:</p>
                {data.PM2_5 && <p className={`font-bold text-lg ${iconColor}`}>PM2.5: {data.PM2_5} µg/m³</p>}
                {data.PM10 && <p className={`text-sm ${iconColor}`}>PM10: {data.PM10} µg/m³</p>}
                {data.PM1 && <p className={`text-sm ${iconColor}`}>PM1: {data.PM1} µg/m³</p>}
              </div>

              {/* Toggleable Chart with PM selection */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <button
                  onClick={() => toggleGraph(data.pmId)}
                  className="flex items-center text-gray-700 text-sm font-medium hover:text-gray-800 mb-4"
                >
                  {graphVisibility[data.pmId] ? <FaChevronUp size={20} /> : <FaChevronDown size={20} />}
                  <span className="ml-2">{graphVisibility[data.pmId] ? 'ซ่อนกราฟ' : 'แสดงกราฟ'}</span>
                </button>

                {graphVisibility[data.pmId] && (
                  <>
                    {/* PM Selection Buttons */}
                    <div className="flex space-x-2 mb-4">
                      {["PM1", "PM10", "PM2_5"].map((param) => (
                        <button
                          key={param}
                          onClick={() => handleSelectPM(data.pmId, param)}
                          className={`px-4 py-2 rounded-lg border ${
                            selectedPM === param
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-gray-800'
                          } transition-colors duration-300`}
                        >
                          {param === "PM2_5" ? "PM2.5" : param}
                        </button>
                      ))}
                    </div>
                    {/* Historical Data Chart for Last 24 Hours */}
                    <Bar
                      data={prepareHistoryChartData(deviceHistory, selectedPM)}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                      height={300}
                      width={500}
                      style={{ maxHeight: '300px', width: '100%' }}
                    />
                  </>
                )}
              </div>

              {/* Display historical data button */}
              {historyData[data.pmId] && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="mt-4">
                    <button
                      onClick={() => window.location.href = `/CPC/User/DashboardIOT/${data.pmId}`}
                      className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all hover:bg-green-700 hover:scale-105"
                    >
                      ไปที่ Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}