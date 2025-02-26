import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useParams } from '@remix-run/react';
import { Line } from 'react-chartjs-2';
import clsx from "clsx";
import { Chart, registerables } from 'chart.js';
import "react-datepicker/dist/react-datepicker.css"; 
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig'; // Import firebase auth ที่กำหนดค่าไว้แล้ว
import HeaderUser from './PartUser/headerUser';

// Lazy load DatePicker และใช้ Suspense wrapper
const DatePicker = lazy(() => import("react-datepicker"));


Chart.register(...registerables);

type DataRow = {
  timestamp: string;
  pm2_5: number;
  pm1: number;
  pm10: number;
  sensorStatus: string;
};

type ChartDataType = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    fill: boolean;
    borderColor: string;
    tension: number;
  }[];
};

type HourlyAverage = {
  time: string;
  avgPM25: number;
  avgPM1: number;
  avgPM10: number;
  count: number;
};

type DailyAverage = {
  date: string;
  avgPM25: number;
  avgPM1: number;
  avgPM10: number;
  count: number;
};

const UserDashboardIOT = () => {
  const [user, setUser] = useState<any>(null);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [userData, setUserData] = useState({
    userName: '',
    useremail: '',
    userId: '',
    userphone: '',
    date: '',
  });
  const navigate = useNavigate();
  const db = getFirestore();

  const { pmId } = useParams(); // ดึง pmId จาก URL
  const [data, setData] = useState<DataRow[]>([]);
  const [chartData, setChartData] = useState<ChartDataType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [averagePM25, setAveragePM25] = useState<number | null>(null);
  const [hourlyAverages, setHourlyAverages] = useState<HourlyAverage[] | null>(null);
  const [dailyAverages, setDailyAverages] = useState<DailyAverage[] | null>(null);
  const chartRef = useRef(null);

  // ตรวจสอบการเข้าสู่ระบบผ่าน Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsLoading(true);

      if (currentUser) {
        // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบด้วย Google หรือไม่
        const isGoogleUser = currentUser.providerData.some(
          (provider) => provider.providerId === 'google.com'
        );

        if (!isGoogleUser) {
          navigate('/cpc/login');
          return;
        }

        console.log('User logged in:', currentUser.email);
        const emailDomain = currentUser.email.split('@')[1];
        if (emailDomain === 'rmutto.ac.th') {
          setUser(currentUser);
          setUserData((prevState) => ({
            ...prevState,
            useremail: currentUser.email,
            userName: currentUser.displayName || '',
          }));
          const userRegistered = localStorage.getItem('userRegistered');
          console.log("Checking user registration in Firestore...");
          if (!userRegistered) {
            checkUserInFirestore(currentUser.uid, currentUser.email);
          } else {
            setIsUserRegistered(true);
          }
        } else {
          navigate('/cpc/login');
        }
      } else {
        navigate('/cpc/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const checkUserInFirestore = async (uid: string, email: string) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('User is already registered in Firestore');
      localStorage.setItem('userRegistered', 'true');
      if (data?.userId === email) {
        setIsUserRegistered(true);
      }
    } else {
      console.log('User not found in Firestore, prompting for registration...');
    }
  };

  // ดึงข้อมูลจาก API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const url = pmId
        ? `http://localhost:3005/api/getHistory/${pmId}`
        : "http://localhost:3005/api/getHistory";
      const response = await fetch(url);
      const json = await response.json();

      const formattedData: DataRow[] = json
        .map((row: any) => ({
          timestamp: row.timestamp,
          pm2_5: row.PM2_5,
          pm1: row.PM1,
          pm10: row.PM10,
          sensorStatus: row.sensorStatus,
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setData(formattedData);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error fetching data.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pmId]);

  // ฟังก์ชันกรองข้อมูลตามช่วงวันที่ที่เลือก
  const getFilteredData = () => {
    return data.filter((row) => {
      const rowDate = new Date(row.timestamp);
      const isDateInRange = (!startDate || rowDate >= startDate) && 
                            (!endDate || rowDate <= endDate);
      return isDateInRange;
    });
  };

  // อัปเดต chartData และคำนวณค่าเฉลี่ย PM2.5 เมื่อข้อมูลหรือช่วงวันที่เปลี่ยน
  useEffect(() => {
    if (data.length > 0) {
      const filteredData = getFilteredData();

      const labels = filteredData.map((row) => row.timestamp);
      const pm2_5Data = filteredData.map((row) => row.pm2_5);
      const pm1Data = filteredData.map((row) => row.pm1);
      const pm10Data = filteredData.map((row) => row.pm10);

      const avgPM25 = pm2_5Data.reduce((acc, value) => acc + value, 0) / (pm2_5Data.length || 1);
      setAveragePM25(avgPM25);

      setChartData({
        labels,
        datasets: [
          {
            label: 'PM2.5 Data',
            data: pm2_5Data,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1,
          },
          {
            label: 'PM1 Data',
            data: pm1Data,
            fill: false,
            borderColor: 'rgba(153, 102, 255, 1)',
            tension: 0.1,
          },
          {
            label: 'PM10 Data',
            data: pm10Data,
            fill: false,
            borderColor: 'rgba(255, 159, 64, 1)',
            tension: 0.1,
          },
        ],
      });
      
      // ล้างค่าเฉลี่ยที่คำนวณไว้ก่อนหน้าเมื่อมีการเปลี่ยนแปลงตัวกรอง
      setHourlyAverages(null);
      setDailyAverages(null);
    }
  }, [data, startDate, endDate]);

  // คำนวณค่าเฉลี่ยรายชั่วโมง
  const computeHourlyAverages = () => {
    const filteredData = getFilteredData();
    const groups: { [key: string]: DataRow[] } = {};

    filteredData.forEach(row => {
      const dateObj = new Date(row.timestamp);
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const date = dateObj.getDate().toString().padStart(2, '0');
      const hour = dateObj.getHours().toString().padStart(2, '0');
      const key = `${year}-${month}-${date} ${hour}:00`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    const hourlyAvg: HourlyAverage[] = Object.entries(groups).map(([key, rows]) => {
      const avgPM25 = rows.reduce((acc, r) => acc + r.pm2_5, 0) / rows.length;
      const avgPM1 = rows.reduce((acc, r) => acc + r.pm1, 0) / rows.length;
      const avgPM10 = rows.reduce((acc, r) => acc + r.pm10, 0) / rows.length;
      return { time: key, avgPM25, avgPM1, avgPM10, count: rows.length };
    });

    hourlyAvg.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    setHourlyAverages(hourlyAvg);
  };

  // คำนวณค่าเฉลี่ยรายวัน
  const computeDailyAverages = () => {
    const filteredData = getFilteredData();
    const groups: { [key: string]: DataRow[] } = {};

    filteredData.forEach(row => {
      const dateObj = new Date(row.timestamp);
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const date = dateObj.getDate().toString().padStart(2, '0');
      const key = `${year}-${month}-${date}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    const dailyAvg: DailyAverage[] = Object.entries(groups).map(([key, rows]) => {
      const avgPM25 = rows.reduce((acc, r) => acc + r.pm2_5, 0) / rows.length;
      const avgPM1 = rows.reduce((acc, r) => acc + r.pm1, 0) / rows.length;
      const avgPM10 = rows.reduce((acc, r) => acc + r.pm10, 0) / rows.length;
      return { date: key, avgPM25, avgPM1, avgPM10, count: rows.length };
    });

    dailyAvg.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setDailyAverages(dailyAvg);
  };

  const handleRestart = () => {
    setStartDate(null);
    setEndDate(null);
    setHourlyAverages(null);
    setDailyAverages(null);
    fetchData(); // รีเฟรชข้อมูลเมื่อกด Restart
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
    <>
      <HeaderUser />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
              <h2 className="text-4xl font-semibold text-center mb-6 text-gray-800">PM2.5 Graph</h2>
      
              {/* Date Range Picker */}
              <div className="mb-8 flex justify-center space-x-4">
                <Suspense fallback={<div>Loading DatePicker...</div>}>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="yyyy/MM/dd HH:mm"
                    showTimeSelect
                    timeFormat="HH:mm"
                    className="border p-3 rounded-lg text-lg text-gray-700 shadow-md focus:ring-2 focus:ring-indigo-500"
                    placeholderText="Select Start Date and Time"
                  />
                </Suspense>
                <Suspense fallback={<div>Loading DatePicker...</div>}>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="yyyy/MM/dd HH:mm"
                    showTimeSelect
                    timeFormat="HH:mm"
                    className="border p-3 rounded-lg text-lg text-gray-700 shadow-md focus:ring-2 focus:ring-indigo-500"
                    placeholderText="Select End Date and Time"
                  />
                </Suspense>
              </div>
      
              {/* แสดงค่าเฉลี่ย PM2.5 แบบ Real-time */}
              {averagePM25 !== null && (
                <div className="mb-6 flex justify-center">
                  <div className="bg-white p-6 shadow-md rounded-lg text-center text-xl font-semibold text-gray-800">
                    <p>Real-time Average PM2.5:</p>
                    <p className="text-2xl text-indigo-600">{averagePM25.toFixed(2)} µg/m³</p>
                  </div>
                </div>
              )}
      
              {/* ปุ่ม Action */}
              <div className="flex justify-center mb-8 space-x-4">
                <button
                  onClick={handleRestart}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 focus:outline-none transition duration-300 transform hover:scale-105"
                >
                  Restart
                </button>
                <button
                  onClick={computeHourlyAverages}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none transition duration-300 transform hover:scale-105"
                >
                  Show Hourly Averages
                </button>
                <button
                  onClick={computeDailyAverages}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 focus:outline-none transition duration-300 transform hover:scale-105"
                >
                  Show Daily Averages
                </button>
              </div>
      
              {/* แสดงกราฟ */}
              {chartData && (
                <div className="bg-white shadow-xl rounded-lg p-8">
                  <Line
                    ref={chartRef}
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        zoom: {
                          pan: {
                            enabled: true,
                            mode: "xy",
                          },
                          zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: "xy",
                          },
                        },
                      },
                    }}
                    height={400}
                  />
                </div>
              )}
      
              {/* แสดงค่าเฉลี่ยรายชั่วโมง */}
              {hourlyAverages && (
                <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Hourly Averages</h3>
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 border">Time</th>
                        <th className="px-4 py-2 border">Avg PM2.5 (µg/m³)</th>
                        <th className="px-4 py-2 border">Avg PM1 (µg/m³)</th>
                        <th className="px-4 py-2 border">Avg PM10 (µg/m³)</th>
                        <th className="px-4 py-2 border">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hourlyAverages.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 border">{item.time}</td>
                          <td className="px-4 py-2 border">{item.avgPM25.toFixed(2)}</td>
                          <td className="px-4 py-2 border">{item.avgPM1.toFixed(2)}</td>
                          <td className="px-4 py-2 border">{item.avgPM10.toFixed(2)}</td>
                          <td className="px-4 py-2 border">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
      
              {/* แสดงค่าเฉลี่ยรายวัน */}
              {dailyAverages && (
                <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Daily Averages</h3>
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 border">Date</th>
                        <th className="px-4 py-2 border">Avg PM2.5 (µg/m³)</th>
                        <th className="px-4 py-2 border">Avg PM1 (µg/m³)</th>
                        <th className="px-4 py-2 border">Avg PM10 (µg/m³)</th>
                        <th className="px-4 py-2 border">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyAverages.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 border">{item.date}</td>
                          <td className="px-4 py-2 border">{item.avgPM25.toFixed(2)}</td>
                          <td className="px-4 py-2 border">{item.avgPM1.toFixed(2)}</td>
                          <td className="px-4 py-2 border">{item.avgPM10.toFixed(2)}</td>
                          <td className="px-4 py-2 border">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
      
              {/* แสดงข้อมูลดิบ */}
              <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
                <h3 className="text-2xl font-semibold text-gray-800">Raw Data</h3>
                <table className="min-w-full mt-4">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border">Timestamp</th>
                      <th className="px-4 py-2 border">PM2.5</th>
                      <th className="px-4 py-2 border">PM1</th>
                      <th className="px-4 py-2 border">PM10</th>
                      <th className="px-4 py-2 border">Sensor Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 border">{row.timestamp}</td>
                        <td className="px-4 py-2 border">{row.pm2_5} µg/m³</td>
                        <td className="px-4 py-2 border">{row.pm1} µg/m³</td>
                        <td className="px-4 py-2 border">{row.pm10} µg/m³</td>
                        <td className="px-4 py-2 border">{row.sensorStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      };

export default UserDashboardIOT;
