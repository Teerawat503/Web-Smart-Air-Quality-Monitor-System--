import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import HeaderUser from './PartUser/headerUser';

const UserContact = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication Check: Only allow access if the user is logged in with Google.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const isGoogleUser = currentUser.providerData.some(
          (provider) => provider.providerId === 'google.com'
        );
        if (!isGoogleUser) {
          navigate('/cpc/login');
          return;
        }
        setUser(currentUser);
      } else {
        navigate('/cpc/login');
      }
      setIsLoading(false); // Update loading state after authentication check
    });

    return () => unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
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
          <span className="text-indigo-600 text-xl font-medium">
            กรุณารอซักครู่ กำลังโหลดเนื้อหา...
          </span>
        </div>
      </div>
    );
  }

  return (
    <><HeaderUser />
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-green-400 to-indigo-500 p-6">
        
      <h1 className="text-3xl font-semibold text-center text-white mb-6 animate-bounce">ติดต่อเรา</h1>
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">ข้อมูลผู้ใช้งาน</h2>
          <p className="text-gray-700">ชื่อ: {user?.displayName}</p>
          <p className="text-gray-700">อีเมล์: {user?.email}</p>
          <p className="text-gray-700">เบอร์โทรศัพท์: {user?.phoneNumber || 'ไม่มีข้อมูล'}</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-gray-800 font-medium">หัวข้อ</label>
            <input
              type="text"
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="หัวข้อของคำถามหรือข้อเสนอแนะ"
            />
          </div>
          <div>
            <label className="block text-gray-800 font-medium">ข้อความ</label>
            <textarea
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              placeholder="กรุณากรอกข้อความที่ต้องการติดต่อ"
            ></textarea>
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-all"
            >
              ส่งข้อความ
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default UserContact;
