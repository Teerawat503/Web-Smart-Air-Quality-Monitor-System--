import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import HeaderUser from './PartUser/headerUser';
import { FaTimes, FaSignOutAlt } from 'react-icons/fa';
import UserDetailIOT from './PartUser/UserdetailIOT';

const UserDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState({
    userName: '',
    useremail: '',
    userId: '',
    userphone: '',
    date: '',
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore();

  // Check user authentication and registration status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      if (currentUser) {
        console.log('User logged in:', currentUser.email);
        const emailDomain = currentUser.email.split('@')[1];
        if (emailDomain === 'rmutto.ac.th') {
          setUser(currentUser);
          setUserData((prevState) => ({
            ...prevState,
            useremail: currentUser.email,
            userName: currentUser.displayName || '',
          }));
          const userRegistered = localStorage.getItem('userRegistered');
          console.log("Checking user registration in Firestore...");
          if (!userRegistered) {
            checkUserInFirestore(currentUser.uid);
          }
        } else {
          navigate('/cpc/login');
        }
      } else {
        navigate('/cpc/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Check if user is already registered in Firestore
  const checkUserInFirestore = async (uid: string) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log('User is already registered in Firestore');
      localStorage.setItem('userRegistered', 'true');
    } else {
      console.log('User not found in Firestore, prompting for registration...');
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (!confirmLogout) return;

    try {
      await signOut(auth);
      localStorage.removeItem('userRegistered');
      setLoading(true);
      setTimeout(() => navigate('/cpc/login'), 1000);
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  // Handle input changes in the registration form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle form submission for registration
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let errors: any = {};

    if (!userData.userName) errors.userName = 'Name is required.';
    if (!userData.useremail) errors.useremail = 'Email is required.';
    if (!userData.userId) errors.userId = 'User number is required.';
    if (!userData.userphone) errors.userphone = 'Phone number is required.';
    if (!userData.date) errors.date = 'Date is required.';

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (userData.useremail && !emailPattern.test(userData.useremail)) {
      errors.useremail = 'Please enter a valid email.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    const signupData = { ...userData };

    try {
      const response = await fetch('http://localhost:3005/api/addUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.message}`);
        localStorage.setItem('userRegistered', 'true');
        setIsModalOpen(false);
        navigate('/cpc/user/dashboard');
      } else {
        const data = await response.json();
        alert(`${data.message || 'User already exists in the system.'}`);
      }
    } catch (error) {
      alert('An error occurred. Please try again later.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a loader while the data is being fetched
  if (loading) {
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
    <div className="bg-gray-100 min-h-screen">
      <HeaderUser />

      <div className="container mx-auto p-6">

        {/* User Profile Section */}
        {user && (
          <div className="bg-white shadow-lg rounded-lg p-4 mb-8 flex items-center space-x-4">
            <img
              src={user.photoURL || 'https://www.gravatar.com/avatar/placeholder.png'}
              alt="Profile"
              className="w-12 h-12 rounded-full"
            />
            
            <div className="flex flex-col">
              <p className="text-lg font-semibold text-gray-600">{user.displayName}</p>
              <p className="text-gray-600">{user.email}</p>
            </div>
            <button
                className="ml-auto text-red-600 hover:text-red-800"
              >CPC_PM2.5
              </button>
            <button
              onClick={handleLogout}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <FaSignOutAlt size={24} />
            </button>
            
          </div>
        )}
        <UserDetailIOT/>
        
        {/* Button to open the registration form */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition duration-300"
        >
          รับการแจ้งเตือน
        </button>

        {/* Modal for registration form */}
        {isModalOpen && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg w-96 relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={24} />
              </button>
              <h2 className="text-xl font-semibold mb-4 text-gray-600">กรอกข้อมูลเพิ่มเติม</h2>
              <form onSubmit={handleFormSubmit}>
                <div className="mb-4">
                  <input
                    type="text"
                    name="userName"
                    value={userData.userName}
                    onChange={handleInputChange}
                    placeholder="Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                    readOnly
                  />
                  {formErrors.userName && (
                    <p className="text-red-600 text-sm">{formErrors.userName}</p>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    type="email"
                    name="useremail"
                    value={userData.useremail}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                    readOnly
                  />
                  {formErrors.useremail && (
                    <p className="text-red-600 text-sm">{formErrors.useremail}</p>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    type="text"
                    name="userId"
                    value={userData.userId}
                    onChange={handleInputChange}
                    placeholder="รหัสนักศึกษา"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  {formErrors.userId && (
                    <p className="text-red-600 text-sm">{formErrors.userId}</p>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    type="text"
                    name="userphone"
                    value={userData.userphone}
                    onChange={handleInputChange}
                    placeholder="เบอร์โทรศัพท์"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  {formErrors.userphone && (
                    <p className="text-red-600 text-sm">{formErrors.userphone}</p>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    type="date"
                    name="date"
                    value={userData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  {formErrors.date && (
                    <p className="text-red-600 text-sm">{formErrors.date}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </form>
            </div>
          </div>
        )}
        
        
      </div>
    </div>
  );
};

export default UserDashboard;
