import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import axios from "axios";
import HeaderAdmin from "./PartAdmin/headerAdmin";

const WAQI_API_URL = "https://api.waqi.info/feed/here/?token=42806fa7f16a1b149b0bcbc39125dbdcea6f309e";

const CPCAdminRankPM = () => {
  // Always call hooks at the top level.
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [combinedData, setCombinedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Retrieve adminId from localStorage
  useEffect(() => {
    const storedAdminId = localStorage.getItem("adminId");
    if (!storedAdminId) {
      navigate("/cpc/login");
    } else {
      setAdminId(storedAdminId);
    }
  }, [navigate]);

  // Fetch admin data
  useEffect(() => {
    if (!adminId) return;

    const checkAdminAccess = async () => {
      try {
        const response = await axios.get(`http://localhost:3005/api/getAdmin/${adminId}`);
        if (response.status === 200) {
          setAdminName(response.data.adminName);
          setEmail(response.data.email);
          setPhone(response.data.phone);
          setDate(response.data.date);
          setIsLoading(false);
        } else {
          setError("ไม่สามารถดึงข้อมูลผู้ดูแลระบบ");
        }
      } catch (err) {
        console.error("Error fetching admin:", err);
        setError("Error fetching admin data.");
        navigate("/cpc/login");
      }
    };

    checkAdminAccess();
  }, [adminId, navigate]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Function to fetch ranking data
  const fetchRankingData = async () => {
    try {
      setIsLoading(true);
      const firestoreRes = await axios.get("http://localhost:3005/api/getIOTData");
      const firestoreData = firestoreRes.data;
      const firestoreItems = firestoreData.map((item: any) => ({
        source: item.pmId, // pmId is now the source
        timestamp: item.timestamp,
        pmValue: Math.round(parseFloat(item.PM2_5)),
        location: item.location, // location stores sensor ID
      }));

      const waqiRes = await axios.get(WAQI_API_URL);
      let waqiPMValue = null;
      let waqiPMId = null;
      if (waqiRes.data.status === "ok") {
        waqiPMValue = Number(waqiRes.data.data.aqi);
        waqiPMId = waqiRes.data.data.city.name;
      }
      const waqiItems = waqiPMValue !== null ? [{
        source: "WAQI",
        timestamp: new Date().toISOString(),
        pmValue: waqiPMValue,
        location: waqiPMId,
      }] : [];

      const combined = [...firestoreItems, ...waqiItems];
      const filteredCombined = combined.filter(item => item.source !== "");
      filteredCombined.sort((a, b) => b.pmValue - a.pmValue);
      setCombinedData(filteredCombined);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error fetching ranking data:", err);
      setError("Error fetching ranking data.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingData();
    const interval = setInterval(() => {
      fetchRankingData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Early returns for loading and error - these are fine as long as all hooks are called above
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
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z"></path>
          </svg>
          <span className="text-indigo-600 text-xl font-medium">
            กรุณารอซักครู่ กำลังโหลดเนื้อหา...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("adminId");
    setTimeout(() => {
      navigate('/cpc/login');
    }, 1000);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <HeaderAdmin adminId={adminId} />
      <div className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between bg-white shadow-md p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <h1
              className="text-2xl font-bold text-indigo-600 cursor-pointer flex items-center"
              onClick={toggleMenu}
            >
              {adminName || "Loading..."}
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#4F46E5" className="ml-2">
                <path d="M480-360 280-560h400L480-360Z" />
              </svg>
            </h1>
            <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm">
              Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition duration-200"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
              <path d="M16 13v-2H7V9h9V7l5 4-5 4zm-2 7H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8V2H6C4.346 2 3 3.346 3 5v14c0 1.654 1.346 3 3 3h8v-2z" />
            </svg>
          </button>
        </div>
        
        {menuOpen && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow-lg p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-indigo-700 mb-4">
                Admin Information
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>ID:</strong> {adminId || "Loading..."}
                </p>
                <p className="text-gray-700">
                  <strong>Name:</strong> {adminName || "Loading..."}
                </p>
                <p className="text-gray-700">
                  <strong>Email:</strong> {email || "Loading..."}
                </p>
                <p className="text-gray-700">
                  <strong>Phone:</strong> {phone || "Loading..."}
                </p>
                <p className="text-gray-700">
                  <strong>Date:</strong> {date || "Loading..."}
                </p>
              </div>
              <a
                href={`/cpc/admin/editprofile/${adminId}`}
                className="block mt-4 text-center text-indigo-500 font-semibold"
              >
                Edit Profile
              </a>
            </div>
          </div>
        )}

        <div className="min-h-screen bg-gradient-to-r from-blue-200 via-green-200 to-indigo-200 p-6">
          <h1 className="text-4xl font-semibold text-center mb-6 text-blue-800 text-shadow-md animate-bounce">
            Real-Time PM2.5 Rankings
          </h1>
          <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-lg">
            <table className="min-w-full table-auto bg-white rounded-lg shadow-md transition-all duration-500">
              <thead className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
                <tr>
                  <th className="px-4 py-2 border-b text-center">Rank</th>
                  <th className="px-4 py-2 border-b text-center">Source</th>
                  <th className="px-4 py-2 border-b text-center">Time</th>
                  <th className="px-4 py-2 border-b text-center">PM2.5</th>
                  <th className="px-4 py-2 border-b text-center">Location</th>
                </tr>
              </thead>
              <tbody>
                {combinedData.map((item, index) => (
                  <tr key={item.location + index} className="hover:bg-indigo-200 transition-all duration-500">
                    <td className="px-4 py-2 border-b text-center text-black font-semibold">{index + 1}</td>
                    <td className="px-4 py-2 border-b text-center text-black font-semibold">{item.source}</td>
                    <td className="px-4 py-2 border-b text-center text-black">
                      {item.source === "WAQI"
                        ? currentTime.toLocaleString()
                        : new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 border-b text-center text-black font-bold text-lg">{item.pmValue}</td>
                    <td className="px-4 py-2 border-b text-center text-black">{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPCAdminRankPM;
