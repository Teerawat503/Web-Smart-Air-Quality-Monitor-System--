import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define the type for the IoT device data
interface IoTDevice {
  pmId: string;
  location: string;
  timestamp: string;
  status: string;
}

const DeviceManagement = () => {
  const [iotData, setIotData] = useState<IoTDevice[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch IoT data from the server
  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3005/api/getIoTData');
      setIotData(response.data);
    } catch (error) {
      console.error('Error fetching IoT data:', error.message);
    }
  };

  // Set up interval to refresh data every second
  useEffect(() => {
    fetchData(); // Fetch data immediately on component mount
    const interval = setInterval(() => {
      fetchData();
    }, 1000); // Refresh every 1000ms (1 second)

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Handle device deletion
  const handleDeleteDevice = async (pmId: string) => {
    try {
      setIsDeleting(true);
      console.log('Deleting device with pmId:', pmId);
      const response = await axios.delete(`http://localhost:3005/api/deleteDevice/${pmId}`);
      if (response.status === 200) {
        setIotData((prevData) => prevData.filter((data) => data.pmId !== pmId));
        alert('Device deleted successfully');
      } else {
        console.error('Failed to delete device');
        alert('Failed to delete device. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting device:', err.message);
      alert('Failed to delete device. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (pmId: string) => {
    setDeviceToDelete(pmId);
    setIsDeleteConfirmOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setDeviceToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (deviceToDelete) {
      handleDeleteDevice(deviceToDelete);
      setIsDeleteConfirmOpen(false);
      setDeviceToDelete(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {iotData.length === 0 ? (
        <div className="text-gray-500 text-center">No devices found.</div>
      ) : (
        iotData
          .filter((device) => device.pmId) // Filter out devices without pmId
          .map((device) => (
            <div key={device.pmId} className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-lg">
              <div>
                <span className="text-white text-xl font-semibold">{device.pmId}</span>
                <div className="text-gray-200 text-sm">{device.location}</div>
              </div>
              <button
                onClick={() => confirmDelete(device.pmId)}
                className="text-white hover:text-red-400 flex items-center space-x-2"
              >
                <svg className="w-5 h-5 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          ))
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg transform transition-all max-w-sm w-full">
            <h3 className="text-xl font-semibold text-gray-800">Are you sure you want to delete this device?</h3>
            <div className="mt-4 flex justify-end space-x-4">
              <button onClick={cancelDelete} className="px-4 py-2 bg-gray-400 text-white rounded-md">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md">
                {isDeleting ? (
                  <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m0 0v4m0-4h4m-4 0H8" />
                  </svg>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;
