import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from '@remix-run/react';
import IOTGPY2024RS from './IOTGPY2024RS';

export default function DetailIOT() {
  const [iotData, setIotData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // เปิด/ปิด modal
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false); 
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null); // เก็บข้อมูลของอุปกรณ์ที่กำลังแก้ไข
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const navigate = useNavigate();

  const handleDetailClick = (pmId: string) => {
    navigate(`/cpc/admin/dashboardiot/${pmId}`);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // อัปเดต timestamp ทุก 1 วินาที
      const currentTime = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
      if (editingDevice) {
        setEditingDevice((prev) => ({
          ...prev,
          timestamp: currentTime, // อัปเดต timestamp เป็นเวลาปัจจุบัน
        }));
      }
    }, 1000);

    // เคลียร์ interval เมื่อ Component ถูก unmount
    return () => clearInterval(interval);
  }, [editingDevice]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3005/api/getIoTData');
        setIotData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching IoT data:', err);
        setError('ไม่สามารถดึงข้อมูล IoT ได้');
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000); // รีเฟรชข้อมูลทุก 1 วินาที

    return () => clearInterval(intervalId);
  }, []);

  const handleStatusChange = async (pmId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    console.log('Changing status for device', pmId, 'to', newStatus);

    try {
      const response = await axios.patch(`http://localhost:3005/api/updateStatus/${pmId}`, {
        status: newStatus,
      });

      if (response.status === 200) {
        setIotData((prevData) =>
          prevData.map((data) =>
            data.pmId === pmId ? { ...data, status: newStatus } : data
          )
        );
        console.log(`Device ${pmId} status updated to ${newStatus}`);
      } else {
        console.error('Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleDeleteDevice = async (pmId: string) => {
    try {
      setIsDeleteConfirmOpen(true);
      const response = await axios.delete(`http://localhost:3005/api/deleteDevice/${pmId}`);
      if (response.status === 200) {
        setIotData((prevData) => prevData.filter((data) => data.pmId !== pmId));
        alert('Device deleted successfully');
      } else {
        alert(`Error: ${response.data.message}`);
      }
    } catch (err: any) {
      console.error('Error deleting device:', err.response?.data || err.message);
      alert(`Failed to delete device: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };
  
  const handleEdit = (device: any) => {
    setEditingDevice(device);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await axios.patch(
        `http://localhost:3005/api/updateIOT/${editingDevice.pmId}`,
        editingDevice
      );
      
      if (response.status === 200) {
        setIotData((prevData) =>
          prevData.map((data) =>
            data.pmId === editingDevice.pmId ? { ...data, ...editingDevice } : data
          )
        );
        setIsEditModalOpen(false);
        setIsSaveConfirmOpen(false);
        alert('อัพเดทข้อมูลสำเร็จ');
      }
    } catch {
      alert('Error updating device');
    }
  };

  const handleSaveConfirmation = () => {
    setIsSaveConfirmOpen(true); // Show save confirmation
  };

  const handleCancelSave = () => {
    setIsSaveConfirmOpen(false); // Close save confirmation
  };

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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-semibold text-indigo-600 text-center mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {iotData
          .filter((data) => data.pmId !== "null" && data.pmId !== "")
          .map((data, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
              <IOTGPY2024RS pmId={data.pmId} />
              <h1 className="text-xl font-medium text-indigo-600">Device Name: {data.pmId}</h1>
              <h1 className="text-xl font-medium text-indigo-600">Status: {data.sensorStatus}</h1>
              <h2 className="text-xl font-medium text-indigo-600">อาคาร: {data.address}</h2>
              <h2 className="text-xl font-medium text-indigo-600">ห้อง: {data.location}</h2>
              <div className="text-gray-500">
                <h4 className="font-semibold text-lg text-indigo-600">IoT Data</h4>
                <ul className="space-y-2">
                  {data.PM1 && (
                    <li className="flex justify-between">
                      <span className="text-sm">PM1</span>
                      <span className="font-medium text-indigo-700">{data.PM1}</span>
                    </li>
                  )}
                  {data.PM10 && (
                    <li className="flex justify-between">
                      <span className="text-sm">PM10</span>
                      <span className="font-medium text-indigo-700">{data.PM10}</span>
                    </li>
                  )}
                  {data.PM2_5 && (
                    <li className="flex justify-between">
                      <span className="text-sm">PM2_5</span>
                      <span className="font-medium text-indigo-700">{data.PM2_5}</span>
                    </li>
                  )}
                </ul>
                <div className="mt-4 flex justify-center items-center space-x-4">
                  <button
                    onClick={() => handleStatusChange(data.pmId, data.status)}
                    className={`px-4 py-2 rounded-full transition duration-300 ease-in-out transform ${
                      data.status === 'active' ? 'bg-green-500 hover:scale-105' : 'bg-red-500 hover:scale-105'
                    }`}
                  >
                    <i
                      className={`fa ${data.status === 'active' ? 'fa-check-circle' : 'fa-times-circle'} text-white text-2xl`}
                    />
                  </button>
                  <span className="text-lg font-medium text-gray-700">
                    {data.status === 'active' ? 'Activate' : 'Deactivate'}
                  </span>

                  {/* Add the Detail button */}
                  <button
                    onClick={() => handleDetailClick(data.pmId)}
                    className="px-3 py-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white transition duration-200 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <i className="fa fa-info-circle text-white text-xl" />
                    <span className="text-sm">Detail</span>
                  </button>

                  <button
                    onClick={() => handleEdit(data)}
                    className="px-3 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition duration-200 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <i className="fa fa-edit text-white text-xl" />
                    <span className="text-sm">Edit</span>

                  </button>

                  <button
                    onClick={() => {
                      setDeviceToDelete(data);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="px-3 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition duration-200 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <span className="text-sm">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
      

         {/* Confirmation Modal */}
          {isDeleteConfirmOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Are you sure you want to delete this device?</h2>
                <div className="flex justify-end space-x-4">
                  <button
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    onClick={() => setIsDeleteConfirmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    onClick={() => {
                      handleDeleteDevice(deviceToDelete.pmId); // Use the device pmId
                      setIsDeleteConfirmOpen(false); // Close modal after delete
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
            {isEditModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setIsEditModalOpen(false)} // Close modal when clicking outside
        >
          <div
            className="bg-white p-8 rounded-lg shadow-lg w-full sm:w-96 md:w-1/2 lg:w-1/3 xl:w-1/4 transform transition-all duration-300 ease-in-out scale-105"
            onClick={(e) => e.stopPropagation()} // Prevent click event from propagating to the overlay
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-semibold text-indigo-600 text-center">Edit Device {editingDevice?.pmId}</h2>

              <button
                onClick={() => setIsEditModalOpen(false)} // Close modal when clicking the close button
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <i className="fa fa-times-circle" />
              </button>

            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">อาคาร:</label>
              <input
                type="text"
                value={editingDevice?.address || ''}
                onChange={(e) => setEditingDevice({ ...editingDevice, address: e.target.value })}
                className="w-full p-2 mt-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-600">ห้องที่ติดตั้ง:</label>
              <input
                type="text"
                value={editingDevice?.location || ''}
                onChange={(e) => setEditingDevice({ ...editingDevice, location: e.target.value })}
                className="w-full p-2 mt-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-600">ip:</label>
              <input
                type="text"
                value={editingDevice?.ip || ''}
                onChange={(e) => setEditingDevice({ ...editingDevice, ip: e.target.value })}
                className="w-full p-2 mt-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="mt-4 text-center">
              <span className="text-sm text-gray-600">Last updated at: {editingDevice?.timestamp}</span>
            </div>

            <div className="mt-6 flex justify-center items-center space-x-4">
              <button
                onClick={handleSaveConfirmation}
                className="px-3 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition duration-200 transform hover:scale-105"
              >
                <i className="fa fa-save text-white text-xl" />
                <span className="text-sm">Save Changes</span>
              </button>
              <button
                onClick={() => setIsEditModalOpen(false)} // Close modal without saving
                className="px-3 py-2 rounded-full bg-gray-400 hover:bg-gray-500 text-white transition duration-200 transform hover:scale-105"
              >
                <span className="text-sm">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {isSaveConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full sm:w-96 md:w-1/2 lg:w-1/3 xl:w-1/4">
            <h2 className="text-2xl font-semibold text-center text-indigo-600">Confirm Save</h2>
            <div className="mt-4 text-center">
              <p className="text-gray-600">Are you sure you want to save these changes?</p>
            </div>

            <div className="mt-6 flex justify-center items-center space-x-4">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition duration-200 transform hover:scale-105"
              >
                <span className="text-sm">Yes</span>
              </button>
              <button
                onClick={handleCancelSave}
                className="px-3 py-2 rounded-full bg-gray-400 hover:bg-gray-500 text-white transition duration-200 transform hover:scale-105"
              >
                <span className="text-sm">No</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}
