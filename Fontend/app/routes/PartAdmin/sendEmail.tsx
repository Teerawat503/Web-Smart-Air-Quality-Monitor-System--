import { useEffect, useState } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import axios from "axios";

interface IoTDevice {
  pmId: string;
  location: string;
  timestamp: string;
  status: string;
}

interface User {
  userId: string;
  userName: string;
  useremail: string;
}

export default function PMMonitorPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [pmData, setPmData] = useState([]);
  const [pmId, setPmId] = useState("");
  const [loading, setLoading] = useState(false);
  const [iotData, setIotData] = useState<IoTDevice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<string>(""); // Added state for selected sensor

  // Fetch IoT Data
  useEffect(() => {
    const fetchIoTData = async () => {
      try {
        const response = await axios.get("http://localhost:3005/api/getIoTData");
        setIotData(response.data);
      } catch (error) {
        console.error("Error fetching IoT data:", error.message);
      }
    };
    fetchIoTData();
  }, []);

  // Fetch User Data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:3005/api/getUser");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch PM2.5 Data based on selected PM Id
  useEffect(() => {
    if (!pmId && selectedSensor !== "all") return;
    const fetchPMData = async () => {
      setLoading(true);
      try {
        let url = selectedSensor === "all" ? "http://localhost:3005/api/getHistorys" : `http://localhost:3005/api/getHistorys/${pmId}`;
        const response = await fetch(url);
        const data = await response.json();
        setPmData(data);
      } catch (error) {
        console.error("Error fetching PM data:", error);
      }
      setLoading(false);
    };
    fetchPMData();
  }, [pmId, selectedSensor]);

  // Function to send email
  const sendEmail = async () => {
  if (selectedUser.length === 0 || pmData.length === 0) {
    alert("กรุณาเลือกผู้ใช้และดึงข้อมูล PM2.5 ก่อน!");
    return;
  }

  // If "Select All" is chosen, display data for all sensors
  const pmDataText = selectedSensor === "all" 
    ? pmData.map(item => `📅 วันที่: ${new Date(item.timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}, 🕒 เวลา: ${item.hour}, ค่าเฉลี่ย: ${item.avgPM}`).join("\n")
    : `📅 วันที่: ${new Date(pmData[0].timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}, 🕒 เวลา: ${pmData[0].hour}, ค่าเฉลี่ย: ${pmData[0].avgPM}`;

  setLoading(true);
  try {
    await fetch("http://localhost:3005/api/sendemail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        useremail: selectedUser.join(", "),
        pmId,
        pmData: pmDataText, // Send PM data for all sensors or just the latest one
      }),
    });
    alert("✅ ส่งอีเมลสำเร็จ!");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งอีเมล:", error);
  }
  setLoading(false);
};

  return (
    <>
      {/* 🔔 Notification Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 bg-purple-600 text-white p-5 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300"
      >
        <IoMdNotificationsOutline size={30} />
      </button>

      {/* 📌 Notification Popup */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-white shadow-2xl rounded-2xl p-6 w-96 max-w-lg transform transition-all duration-300 scale-100 opacity-100">
            <h1 className="text-2xl font-semibold text-purple-800 text-center mb-5">📡 PM2.5 Monitoring</h1>

            {/* 📈 Display PM2.5 Data */}
            {pmData.length > 0 && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-300 rounded-lg">
                <p className="text-xl font-semibold text-purple-700 text-center mb-3">ข้อมูล PM2.5 ล่าสุดที่จะส่ง</p>
                {
                  // Sort and display latest PM data
                  pmData
                    .map(item => ({
                      ...item,
                      timestamp: new Date(item.timestamp).toLocaleString("th-TH", {
                        timeZone: "Asia/Bangkok",
                      }),
                    }))
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] && (
                      <p className="text-lg font-medium text-red-600">
                        🕒 {pmData[0].hour} - {pmData[0].avgPM} {/* Display only the latest data */}
                      </p>
                    )
                }
              </div>
            )}

            {/* 🔻 Select PM2.5 Sensor */}
            <select
              className="w-full mb-4 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={pmId}
              onChange={async (e) => {
                const newPmId = e.target.value;
                setPmId(newPmId);
                setSelectedSensor(newPmId); // Store the selected sensor
                // Fetch PM2.5 Data for the newly selected sensor
                if (newPmId) {
                  setLoading(true);
                  try {
                    const response = await fetch(`http://localhost:3005/api/getHistorys/${newPmId}`);
                    const data = await response.json();
                    setPmData(data);
                  } catch (error) {
                    console.error("Error fetching PM data:", error);
                  }
                  setLoading(false);
                }
              }}
            >
              <option value="">เลือก PM2.5 Sensor</option>
              {iotData.map((sensor) => (
                <option key={sensor.pmId} value={sensor.pmId}>
                  {sensor.pmId} (ห้อง {sensor.location})
                </option>
              ))}
              {/* Option for Select All */}
              <option value="all">เลือกทั้งหมด</option>
            </select>

            {/* If "Select All" is chosen, load data for all sensors */}
            {selectedSensor === "all" && (
              <div className="text-center text-purple-700">
                <p>คุณเลือกทั้งหมด, ข้อมูล PM2.5 จะถูกรวมจากทุกๆ Sensor</p>
              </div>
            )}

            {/* 👤 Select User Dropdown */}
            <h2 className="text-lg font-semibold text-gray-700 mt-6">👤 เลือกผู้ใช้</h2>
            <button
              onClick={() => setSelectedUser(users.map((user) => user.useremail))}
              className={`w-full mb-4 ${selectedUser.length === users.length ? "bg-green-600" : "bg-green-500"} hover:bg-green-600 text-white py-3 rounded-xl transition duration-300`}
            >
              {selectedUser.length === users.length ? "✅ เลือก Email ทั้งหมดแล้ว" : "✅ เลือก Email ทั้งหมด"}
            </button>

            <button
              onClick={() => setSelectedUser([])}
              className="w-full mb-4 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl transition duration-300"
            >
              ❌ ล้างการเลือก
            </button>

            <select
              multiple
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300"
              onChange={(e) =>
                setSelectedUser(Array.from(e.target.selectedOptions, (option) => option.value))
              }
              value={selectedUser}
            >
              {users.map((user) => (
                <option key={user.userId} value={user.useremail}>
                   {user.useremail} {user.userName}
                </option>
              ))}
            </select>

            {/* 📧 Send Email Button */}
            <button
              onClick={sendEmail}
              className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl transition duration-300"
            >
              {loading ? "⏳ กำลังส่ง..." : "📧 ส่งอีเมลแจ้งเตือน"}
            </button>

            {/* ❌ Close Popup Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl transition duration-300"
            >
              ❌ ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
