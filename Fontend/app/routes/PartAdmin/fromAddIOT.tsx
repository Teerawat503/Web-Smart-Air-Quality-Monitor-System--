import { useState, useEffect } from 'react';
import axios from 'axios';
import DeviceManagement from './IoTDevice';

export default function AddIoTForm() {
  const [formData, setFormData] = useState({
    pmId: '',
    timestamp: '',
    address: '',
    location: '',
    ip: '',
    status: 'inactive',
  });
  const [iotStatus, setIotStatus] = useState('inactive');
  const [deviceList, setDeviceList] = useState([]);

  // Persist formData and deviceList to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('formData');
    const savedDeviceList = localStorage.getItem('deviceList');

    if (savedData) setFormData(JSON.parse(savedData));
    if (savedDeviceList) setDeviceList(JSON.parse(savedDeviceList));
  }, []);

  useEffect(() => {
    localStorage.setItem('formData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('deviceList', JSON.stringify(deviceList));
  }, [deviceList]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
      setFormData((prevData) => ({
        ...prevData,
        timestamp: now,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const dataWithTimestamp = {
      pmId: formData.pmId || 'ไม่ระบุ',
      address: formData.address || 'ไม่มีข้อมูล',
      location: formData.location || 'ไม่ระบุ',
      ip: formData.ip || 'ไม่มีข้อมูล',  // Ensure this is included
      status: formData.status || 'inactive',
      timestamp: formData.timestamp || '',
    };
  
    try {
      const response = await axios.post('http://localhost:3005/api/addIoTData', dataWithTimestamp);
      if (response.status === 200) {  // Should be 200 for successful POST
        setDeviceList((prevList) => [...prevList, dataWithTimestamp]);
        alert('บันทึกข้อมูลสำเร็จ!');
      }
    } catch (error) {
      console.error('Error adding IoT data:', error);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.response ? error.response.data.message : error.message}`);
    }
  };
  

  const toggleIoTStatus = async () => {
    if (!formData.pmId) {
      alert('กรุณาเลือกหรือกรอก PM ID ก่อนเปลี่ยนสถานะ');
      return;
    }

    const newStatus = iotStatus === 'inactive' ? 'Online' : 'inactive';

    try {
      const response = await axios.put('http://localhost:3005/api/updateIoTStatus', {
        pmId: formData.pmId,
        status: newStatus,
      });

      if (response.status === 200) {
        setIotStatus(newStatus);
        setFormData((prevData) => ({ ...prevData, status: newStatus }));
        alert('เปลี่ยนสถานะสำเร็จ');
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      alert('ไม่สามารถอัปเดตสถานะได้');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-semibold text-indigo-600 text-center mb-8">เพิ่ม/แก้ไขข้อมูล อุปกรณ์ IoT</h1>
     {/* ฟอร์ม */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">PM ID</label>
          <input
            type="text"
            name="pmId"
            value={formData.pmId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">อาคาร (Address)</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={2}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">ห้องที่ติดตั้ง (location)</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">IP (IP device)</label>
          <input
            type="text"
            name="ip"
            value={formData.ip}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-center text-gray-700">Timestamp (เวลาปัจจุบัน)</label>
          <input
            type="text"
            name="timestamp"
            value={formData.timestamp}
            readOnly
            className="mt-1 block w-full rounded-md bg-gray-700 text-center border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        บันทึกข้อมูล
      </button>
    </form>
    <DeviceManagement/>
  </div>
);
}
