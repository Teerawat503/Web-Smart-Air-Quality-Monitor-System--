import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserDetailIOT() {
  const [iotData, setIotData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pm25, setPM25] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3005/api/getIoTData');
        const filteredData = response.data.filter(
          (data: any) => data.pmId !== null && data.pmId !== undefined
        );
        setIotData(filteredData);
        setLoading(false);
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

  useEffect(() => {
    const fetchPM25 = async () => {
      try {
        const response = await fetch('https://api.waqi.info/feed/here/?token=42806fa7f16a1b149b0bcbc39125dbdcea6f309e');
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลได้');
        }
        const data = await response.json();
        setPM25(Math.round(data.data.iaqi.pm25.v)); // ใช้ Math.round() ตัดทศนิยม
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchPM25();
  }, []);

  if (loading) {
    return <div className="text-lg text-gray-700 text-center">กำลังโหลดข้อมูล...</div>;
  }

  if (error) {
    return <div className="text-lg text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6">
      <h1 className="text-3xl font-semibold text-indigo-600 text-center mb-8">คุณภาพอากาศ</h1>
      <div className="flex flex-wrap gap-4 justify-center mt-6">
        
        {pm25 !== null && (
            
          <div className="bg-white p-6 rounded-lg shadow-lg w-100 text-center border border-gray-300">
            <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">ค่าฝุ่น PM2.5 ในกรุงเทพฯ</h1>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900 mb-4">ค่าฝุ่น PM2.5 ปัจจุบัน:</p>
              <p className="text-5xl font-bold text-blue-600">{pm25} µg/m³</p>
              <p className="text-sm text-gray-500 mt-2">
                ค่าฝุ่นที่สูงอาจเป็นสัญญาณของมลพิษที่อาจส่งผลต่อสุขภาพ
              </p>
            </div>
          </div>
        )}
        {iotData.map((data, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-lg w-100 text-center border border-gray-300">
            <h1 className="text-3xl font-bold text-blue-600 mb-4">ค่าฝุ่น PM2.5 อาคาร {data.address}</h1>
            <p className="text-10 font-semibold text-gray-900">หมายเลขห้อง:{data.location}</p>
            <p className="text-2xl font-semibold text-gray-900">ค่าฝุ่น PM2.5 ปัจจุบัน:</p>
            <p className="text-5xl font-bold text-blue-600 mt-2">{Math.round(data.PM2_5)} µg/m³</p> 
            <p className="text-sm text-gray-500 mt-2">ค่าฝุ่นที่สูงอาจเป็นสัญญาณของมลพิษที่อาจส่งผลต่อสุขภาพ</p>
          </div>
        ))}
      </div>
    </div>
  );
}
