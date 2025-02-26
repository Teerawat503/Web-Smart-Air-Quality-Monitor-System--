import { useState, useEffect } from 'react';
import axios from 'axios'; // อย่าลืมนำเข้า axios

interface DeviceProps {
  pmId: string;
}

const IOTGPY2024RS = ({ pmId }: DeviceProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceIp, setDeviceIp] = useState<string | null>(null); // สถานะเก็บ IP ของอุปกรณ์
  const [pingResult, setPingResult] = useState<string>(''); // State for ping result

  useEffect(() => {
    const fetchDeviceIp = async () => {
      try {
        const response = await fetch(`http://localhost:3005/api/getIoTDataByPmId?pmId=${pmId}`);
        const data = await response.json();
    
        // ตรวจสอบว่าข้อมูลที่ได้เป็นแบบที่คาดหวังหรือไม่
        if (response.ok && data && Array.isArray(data) && data.length > 0) {
          // ตรวจสอบว่า IP มีอยู่ในข้อมูลหรือไม่
          const ip = data[0]?.ip;
          if (ip) {
            setDeviceIp(ip); // เก็บ IP ที่ได้รับ
          } else {
            setError("ไม่พบ IP สำหรับอุปกรณ์นี้");
          }
        } else {
          setError("ไม่พบข้อมูลหรือ IP จากฐานข้อมูล");
        }
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล IP: " + err.message);
      }
    };

    if (pmId) {
      fetchDeviceIp();
    }
  }, [pmId]);

  const handlePing = async () => {
    if (!deviceIp) {
      setPingResult('ไม่พบ IP สำหรับการ Ping');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3005/api/ping', { ip: deviceIp });
      setPingResult(response.data.message);
    } catch (err) {
      setPingResult('ไม่สามารถ Ping ไปยัง IP นี้ได้');
    }
  };

  const handleRestart = async () => {
    if (!deviceIp) {
      setError("ไม่มี IP สำหรับการรีสตาร์ท");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ใช้ deviceIp ที่ได้จากฐานข้อมูล
      const response = await fetch(`http://${deviceIp}/restart`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to restart ESP8266");
      }

      alert("ESP8266 restarted successfully!");
    } catch (err) {
      setError("Failed to restart ESP8266: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ปุ่ม Restart */}
      <button
        onClick={handleRestart}
        disabled={loading || !deviceIp}
        className={`px-4 py-2 rounded-md text-white font-semibold ${loading ? "bg-gray-500" : error ? "bg-red-600" : "bg-green-600"
          }`}
      >
        {loading ? "Restarting..." : "Restart DEVICE"}
      </button>

      <div className="mt-4">
        <button
          onClick={handlePing}
          className="px-4 py-2 rounded-md inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all hover:bg-blue-700 hover:scale-105"
        >
          ทดสอบ Ping
        </button>
        {pingResult && <p className="mt-2 text-sm text-gray-600">{pingResult}</p>}
      </div>

      {/* แสดงข้อความ error ถ้ามี */}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
};

export default IOTGPY2024RS;
