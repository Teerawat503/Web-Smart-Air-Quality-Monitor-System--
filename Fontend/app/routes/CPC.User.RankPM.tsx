import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HeaderUser from './PartUser/headerUser';
import { auth } from '../firebaseConfig'; // adjust path to your Firebase config

// URL for WAQI API (real-time air quality)
const WAQI_API_URL = "https://api.waqi.info/feed/here/?token=42806fa7f16a1b149b0bcbc39125dbdcea6f309e";

const CPCUserRankPM = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [combinedData, setCombinedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

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
    });
    return () => unsubscribe();
  }, [navigate]);

  // Update current time every second so that the WAQI timestamp appears to update in real time.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch ranking data from both APIs and combine.
  const fetchRankingData = async () => {
    setIsLoading(true);
    try {
      // Fetch local historical data (hourly averaged PM2.5) from your API:
      const firestoreRes = await axios.get("http://localhost:3005/api/getIOTData");
      const firestoreData = firestoreRes.data;
      const firestoreItems = firestoreData.map((item: any) => ({
        source: item.pmId,        // pmId is now the source
        timestamp: item.timestamp,
        pmValue: Math.round(parseFloat(item.PM2_5)),
        location: item.location,        // location now stores pmId (sensor ID)
      }));

      // Fetch real-time data from WAQI API:
      const waqiRes = await axios.get(WAQI_API_URL);
      let waqiPMValue = null;
      let waqiPMId = null;
      if (waqiRes.data.status === "ok") {
        waqiPMValue = Number(waqiRes.data.data.aqi);
        waqiPMId = waqiRes.data.data.city.name;  // This is the location (sensor ID)
      }
      const waqiItems = waqiPMValue !== null ? [{
        source: "WAQI",            // pmId is now the source
        timestamp: new Date().toISOString(),
        pmValue: waqiPMValue,
        location: waqiPMId,        // location stores the sensor ID
      }] : [];

      // Combine both data sources.
      const combined = [...firestoreItems, ...waqiItems];

      // Filter out entries where pmId (source) is an empty string.
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

  // Fetch ranking data on mount and update periodically (every 60 seconds) for continuous real-time updates.
  useEffect(() => {
    fetchRankingData();
    const interval = setInterval(() => {
      fetchRankingData();
    }, 60000); // Update every 60 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <p className="text-3xl font-semibold animate-pulse">Loading ranking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 text-lg font-semibold animate-pulse">
        {error}
      </div>
    );
  }

  return (
    <>
      <HeaderUser />
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
                      ? currentTime.toLocaleString() // Display continuously updating time for real-time data
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
    </>
  );
};

export default CPCUserRankPM;
