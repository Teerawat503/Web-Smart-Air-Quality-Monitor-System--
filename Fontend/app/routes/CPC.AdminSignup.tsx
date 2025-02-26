import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PropTypes from "prop-types";

// Reusable InputField Component
function InputField({ label, type, value, onChange, required, placeholder, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-black">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  );
}

InputField.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

function LoadingScreen({ message }) {
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
        <span className="text-indigo-600 text-xl font-medium">{message}</span>
      </div>
    </div>
  );
}

export default function AdminSignup() {
  const navigate = useNavigate();

  // State hooks for form fields
  const [role] = useState("admin");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminId, setAdminId] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showPassword, setShowPassword] = useState(false);

  // User authentication state
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupLoading, setSignupLoading] = useState(false);

  // Form validation function
  const validateSignupData = ({ adminName, email, adminPass, adminId, phone, date }) => {
    if (!adminName || !email || !adminPass || !adminId || !phone || !date) {
      return "All fields are required.";
    }
    if (!email.includes("@cpc.rmutto.ac.th")) {
      return "Please enter a valid email with domain @cpc.rmutto.ac.th.";
    }
    if (adminPass.length < 8 || !/[A-Z]/.test(adminPass) || !/[0-9]/.test(adminPass)) {
      return "Password must be at least 8 characters long and include uppercase letters and numbers.";
    }
    if (!/^\d{10}$/.test(phone)) {
      return "Phone number must be 10 digits.";
    }
    return null; // No errors
  };

  // Handle signup form submission
  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate form data
    const error = validateSignupData({ adminName, email, adminPass, adminId, phone, date });
    if (error) {
      toast.error(error);
      return;
    }

    setSignupLoading(true);
    
    // Create signup data with adminId as adminId
    const signupData = { 
      role, 
      adminName, 
      email, 
      adminPass, 
      adminId,  // Set adminId equal to adminId
      phone, 
      date 
    };

    try {
      const response = await fetch(`http://localhost:3005/api/addAdmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "An error occurred during the signup.");
        console.error("Error Response:", errorData);
        throw new Error(errorData.message || "Error during signup");
      }

      const data = await response.json();
      toast.success(data.message || "Admin registered successfully!");
      setAdminName("");
      setEmail("");
      setAdminPass("");
      setAdminId("");
      setPhone("");
      setDate(new Date().toISOString().split("T")[0]);
      navigate("/cpc/adminsignup");  // Navigate to dashboard or any desired page
    } catch (error) {
      console.error("Error during signup:", error);
      toast.error(`[ERR] An error occurred while submitting the form. Error: ${error.message}`);
    } finally {
      setSignupLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentAdmin) => {
      if (currentAdmin) {
        setAdmin(currentAdmin);
      } else {
        navigate("/cpc/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await signOut(auth);
        setLoading(true);
        toast.info("Logging out...");
        setTimeout(() => {
          navigate("/cpc/login");
        }, 1000);
      } catch (error) {
        console.error("Logout error", error);
      }
    }
  };

  if (loading) {
    return <LoadingScreen message="กรุณารอซักครู่ กำลังโหลดเนื้อหา..." />;
  }

  return admin ? (
    <div className="flex min-h-screen items-center justify-center bg-indigo-100">
      <ToastContainer />
      <div className="w-full max-w-md bg-indigo-300 p-8 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-700">SignUp/Admin</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <InputField label="Role" type="text" value={role} required disabled />
          <InputField
            label="ชื่อ-สกุล(ภาษาไทย)"
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            required
          />
          <InputField
            label="อีเมล @cpc.rmutto.ac.th"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <InputField
              label="รหัสผ่าน"
              type={showPassword ? "text" : "password"}
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-8 text-gray-500"
              aria-label="Toggle password visibility"
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>
          <InputField
            label="รหัสผู้ดูแล"
            type="text"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            required
          />
          <InputField
            label="เบอร์โทรติดต่อ"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <InputField
            label="วันที่ลงทะเบียน"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={signupLoading}
          >
            {signupLoading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        <button
          onClick={handleLogout}
          className="w-full mt-4 py-2 px-4 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Log out
        </button>
      </div>
    </div>
  ) : null;
}
