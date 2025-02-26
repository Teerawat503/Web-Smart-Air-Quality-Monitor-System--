import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { auth, googleProvider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState("");
  const [isAdminLogin, setIsAdminLogin] = useState(false); // State to toggle between admin/user login
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const user = auth.currentUser;
      if (user) {
        navigate("/cpc/user/dashboard");
      }
    };
    checkUserLoggedIn();
  }, [navigate]);

  const login = async (email, password) => {
    setLoadingAdmin(true);
    setError("");
    
    try {
      const response = await axios.post("http://localhost:3005/api/login", { email, password });
      if (response.status === 200) {
        const { adminId, role } = response.data;

        if (adminId) {
          localStorage.setItem("adminId", adminId);
        } else {
          setError("Email ไม่ถูกต้อง");
          return;
        }
        if (role === "admin") {
          alert("ลงชื่อเข้าใช้งานสำเร็จ");
          navigate(`/cpc/admin/dashboard/${adminId}`);
        } else {
          navigate("/cpc/user/dashboard");
        }
      } else {
        setError(response.data.message || "กรุณากรอก Email และ Password");
      }
    } catch (error) {
      setError(error.response?.data?.message || "กรุณาลงชื่อเข้าให้ใหม่อีกครั้ง");
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    if (!email || !adminPass) {
      setError("กรุณากรอก Email และ Password");
      return;
    }
    login(email, adminPass);
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError("");
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const emailDomain = user.email.split("@")[1];

      if (emailDomain !== "rmutto.ac.th" && user.email !== "cramza556@gmail.com" && user.email !== "teerawatbarnvimol@gmail.com") {
        setError("เข้าได้เฉพาะ @rmutto.ac.th เท่านั้น");
        await auth.signOut();
        return;
      }

      localStorage.setItem("userEmail", user.email);

      if (user.email === "cramza556@gmail.com" || user.email === "teerawatbarnvimol@gmail.com") {
        window.open("/cpc/adminsignup", "_blank");
      } else {
        navigate("/cpc/user/dashboard");
      }
    } catch (error) {
      setError("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-indigo-100">
      <div className="w-full max-w-md bg-indigo-300 p-8 shadow-lg rounded-lg transition-all duration-500">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-700">Login</h1>

        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Admin Login Form */}
        {isAdminLogin && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pl-10"
              />
              <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#e8eaed"
          className="absolute left-2 top-7 w-7 h-7 text-gray-600"
        >
          <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" />
        </svg>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                required
                placeholder="Enter your password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pl-10"
              />
              <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e8eaed"
                    className="absolute left-2 top-7 w-7 h-7 text-gray-600"
                >
                    <path d="M80-200v-80h800v80H80Zm46-242-52-30 34-60H40v-60h68l-34-58 52-30 34 58 34-58 52 30-34 58h68v60h-68l34 60-52 30-34-60-34 60Zm320 0-52-30 34-60h-68v-60h68l-34-58 52-30 34 58 34-58 52 30-34 58h68v60h-68l34 60-52 30-34-60-34 60Zm320 0-52-30 34-60h-68v-60h68l-34-58 52-30 34 58 34-58 52 30-34 58h68v60h-68l34 60-52 30-34-60-34 60Z" />
                </svg>

              <div className="absolute right-2 top-9 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                <div
                  className={`w-8 h-4 flex items-center bg-gray-300 rounded-full p-1 duration-200 ${showPassword ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-200 ${showPassword ? "translate-x-3" : "translate-x-0"}`}
                  ></div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingAdmin}
              className={`w-full py-2 px-4 flex items-center justify-center bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-800 ${loadingAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loadingAdmin && (
                <svg
                  className="animate-spin mr-2 w-5 h-5 text-white translate-x-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
              )}
              {loadingAdmin ? "" : "Admin Login"}
            </button>
          </form>
        )}

        {/* User Login (Google) Form */}
        {!isAdminLogin && (
          <div className="flex flex-col items-center">
            <button
        onClick={handleGoogleLogin}
        disabled={loadingGoogle}
        className={`w-full py-2 px-4 flex items-center justify-center bg-white text-black font-semibold rounded-full 
            hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${loadingGoogle ? "opacity-50 cursor-not-allowed" : ""}`}
        >
        {loadingGoogle && (
            <svg
            className="animate-spin mr-2 w-5 h-5 text-white translate-x-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
        )}

        {!loadingGoogle && (
            <div className="flex items-center space-x-2">
            <svg
                aria-hidden="true"
                className="w-6 h-6 text-gray-700"
                width="18"
                height="18"
                viewBox="0 0 18 18"
            >
                <path
                fill="#4285F4"
                d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18"
                />
                <path
                fill="#34A853"
                d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17"
                />
                <path
                fill="#FBBC05"
                d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"
                />
                <path
                fill="#EA4335"
                d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.8 4.8 0 0 1 4.48-3.3"
                />
            </svg>
            <span>User Login with Google</span>
            </div>
        )}
        </button>
          </div>
        )}
         {/* Toggle Button */}
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
      <button
        className={`hover:bg-indigo-500 hover:text-white text-xl text-indigo-700 rounded-full transition-transform duration-500 ${isAdminLogin ? "rotate-180" : "rotate-0"} text-xl bg-white p-3  shadow-lg `}
        onClick={() => setIsAdminLogin(!isAdminLogin)}
      >
        {isAdminLogin ? (
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
            <path d="M160-160v-80h110l-16-14q-52-46-73-105t-21-119q0-111 66.5-197.5T400-790v84q-72 26-116 88.5T240-478q0 45 17 87.5t53 78.5l10 10v-98h80v240H160Zm400-10v-84q72-26 116-88.5T720-482q0-45-17-87.5T650-648l-10-10v98h-80v-240h240v80H690l16 14q49 49 71.5 106.5T800-482q0 111-66.5 197.5T560-170Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
            <path d="M204-318q-22-38-33-78t-11-82q0-134 93-228t227-94h7l-64-64 56-56 160 160-160 160-56-56 64-64h-7q-100 0-170 70.5T240-478q0 26 6 51t18 49l-60 60ZM481-40 321-200l160-160 56 56-64 64h7q100 0 170-70.5T720-482q0-26-6-51t-18-49l60-60q22 38 33 78t11 82q0 134-93 228t-227 94h-7l64 64-56 56Z" />
          </svg>
        )}
      </button>
    </div>
      </div>
    </div>
  );
}
