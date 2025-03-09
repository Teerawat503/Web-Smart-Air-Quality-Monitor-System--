import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSmog } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register the required chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function UserDetailIOT() {
  const [iotData, setIotData] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ip, setIp] = useState<string>(''); // State for IP input
  const [pingResult, setPingResult] = useState<string>(''); // State for ping result

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch IoT data
        const response = await axios.get('http://localhost:3005/api/getIoTData');
        const filteredData = response.data.filter(
          (data: any) => data.pmId !== null && data.pmId !== undefined && data.status !== 'inactive'
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
      labels: ['PM1', 'PM10', 'PM2.5'], // กำหนด labels ให้เป็น PM1, PM10, PM2.5
      datasets: [
        {
          label: 'PM1', // ชื่อเส้นสำหรับ PM1
          data: [data.PM1 || 0, 0, 0], // ข้อมูลสำหรับ PM1 (แค่ค่าเดียว)
          borderColor: '#34D399', // สีเส้นสำหรับ PM1
          borderWidth: 2, // ความหนาของเส้น
          fill: false, // ไม่ให้เติมสีใต้เส้น
          pointBackgroundColor: '#34D399', // สีจุดที่แสดงบนเส้น
          pointBorderColor: '#34D399', // สีกรอบจุด
          pointRadius: 5, // ขนาดจุด
          tension: 0.1, // ความโค้งของเส้น
        },
        {
          label: 'PM10', // ชื่อเส้นสำหรับ PM10
          data: [0, data.PM10 || 0, 0], // ข้อมูลสำหรับ PM10 (แค่ค่าเดียว)
          borderColor: '#FBBF24', // สีเส้นสำหรับ PM10
          borderWidth: 2, // ความหนาของเส้น
          fill: false, // ไม่ให้เติมสีใต้เส้น
          pointBackgroundColor: '#FBBF24', // สีจุดที่แสดงบนเส้น
          pointBorderColor: '#FBBF24', // สีกรอบจุด
          pointRadius: 5, // ขนาดจุด
          tension: 0.1, // ความโค้งของเส้น
        },
        {
          label: 'PM2.5', // ชื่อเส้นสำหรับ PM2.5
          data: [0, 0, data.PM2_5 || 0], // ข้อมูลสำหรับ PM2.5 (แค่ค่าเดียว)
          borderColor: '#F87171', // สีเส้นสำหรับ PM2.5
          borderWidth: 2, // ความหนาของเส้น
          fill: false, // ไม่ให้เติมสีใต้เส้น
          pointBackgroundColor: '#F87171', // สีจุดที่แสดงบนเส้น
          pointBorderColor: '#F87171', // สีกรอบจุด
          pointRadius: 5, // ขนาดจุด
          tension: 0.1, // ความโค้งของเส้น
        },
      ],
      options: {
        responsive: true, // ทำให้กราฟตอบสนองต่อขนาดหน้าจอ
        scales: {
          y: {
            beginAtZero: true, // เริ่มแกน Y จาก 0
          },
        },
      },
    };
  };
  
  

  // Function to test ping
  const handlePing = async () => {
    if (!ip) {
      setPingResult('กรุณากรอก IP');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3005/api/ping', { ip });
      setPingResult(response.data.message);
    } catch (err) {
      setPingResult('ไม่สามารถ Ping ไปยัง IP นี้ได้');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-semibold text-indigo-600 text-center mb-8">
        คุณภาพอากาศ RMUTTO
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
        {iotData.map((data, index) => {
          const pm2_5 = data.PM2_5 || 0;
          const { backgroundColor, fontColor, iconColor } = getColors(pm2_5);

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

              {/* Display bar chart for PM data */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <p className="text-gray-700 text-sm font-medium">กราฟระดับมลพิษ:</p>
                <Bar data={prepareChartData(data)} />
              </div>

              {/* Display historical data */}
              {historyData[data.pmId] && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="mt-4">
                    <button
                      onClick={() => window.location.href = `/CPC/Admin/DashboardIOT/${data.pmId}`} // ส่ง pmId ผ่าน URL
                      className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all hover:bg-green-700 hover:scale-105"
                    >
                      ไปที่ Dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* Input for IP and Ping */}
              {/* <div className="mt-4">
                <input
                  type="text"
                  placeholder="กรอก IP สำหรับ Ping"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className="px-4 py-2 border rounded-lg w-full mb-2"
                />
                <button
                  onClick={handlePing}
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all hover:bg-blue-700 hover:scale-105"
                >
                  ทดสอบ Ping
                </button>
                {pingResult && <p className="mt-2 text-sm text-gray-600">{pingResult}</p>}
              </div> */}
            </div>
          );
        })}
      </div>
    </div>
  );
} 
