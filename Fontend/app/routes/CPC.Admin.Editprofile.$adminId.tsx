import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import axios from "axios";
import HeaderAdmin from "./PartAdmin/headerAdmin";

export default function AdminUpdate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  // State hooks for form fields
  const [role] = useState("admin");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Handle form submission
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminId) {
      alert("Admin ID is missing.");
      return;
    }

    const adminData = {
      role,
      adminName,
      email,
      adminPass,
      adminId,
      phone,
      date,
    };

    try {
      const response = await axios.post(
        `http://localhost:3005/api/updateAdmin/${adminId}`,
        adminData
      );

      if (response.data.message === "Admin updated successfully.") {
        alert(response.data.message);
        navigate(`/cpc/admin/dashboard/${adminId}`);
      } else {
        alert(response.data.message || "Failed to update admin.");
      }
    } catch (error) {
      console.error("[Error Updating Admin]:", error);
      const errorMessage = error.response?.data?.message || "An error occurred. Please try again.";
      alert(errorMessage);
    }
  };

  // Fetch admin data on page load
  useEffect(() => {
    const storedAdminId = localStorage.getItem("adminId");

    if (!storedAdminId) {
      alert("You must log in to access this page.");
      navigate("/cpc/login");
    } else {
      setAdminId(storedAdminId);

      // Fetch the admin details from the API
      axios
        .get(`http://localhost:3005/api/getAdmin/${storedAdminId}`)
        .then((response) => {
          const { adminName, email, phone, date } = response.data;
          setAdminName(adminName);
          setEmail(email);
          setPhone(phone);
          setDate(date);
          setIsLoading(false); // Stop loading when data is fetched
        })
        .catch((error) => {
          console.error("[Error Fetching Admin Data]:", error);
          alert("Failed to load admin data.");
          setIsLoading(false);
        });
    }
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
    <>
      <HeaderAdmin adminId={adminId} />
      <div className="flex min-h-screen items-center justify-center bg-indigo-100">
        <div className="w-full max-w-md bg-white p-8 shadow-lg rounded-lg">
          <h1 className="text-2xl font-bold text-center mb-6 text-indigo-700">
            Update Admin Profile
          </h1>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black">Role</label>
              <input
                type="text"
                value={role}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black">Name</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-black">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={`w-20 h-6 flex items-center bg-gray-300 rounded-full p-0 duration-200 ${showPassword ? "bg-green-500" : "bg-gray-300"}`}
                >
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black">Admin ID</label>
              <input
                type="text"
                value={adminId || ""}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black">Registration Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
            >
              Update Profile
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
