import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "@remix-run/react";
import HeaderAdmin from "./PartAdmin/headerAdmin";
import SendEmail from "./PartAdmin/sendEmail";

const DetailUser = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null); // The user being edited
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get adminId from localStorage
  useEffect(() => {
    const storedAdminId = localStorage.getItem("adminId");
    if (!storedAdminId) {
      navigate("/cpc/login");
    } else {
      setAdminId(storedAdminId);
    }
  }, [navigate]);

  // Check admin access
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

  // Fetch users data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:3005/api/getUser");
        if (response.status === 200) {
          const filteredUsers = response.data.filter((user: any) => user.role === 'user');
          setUsersData(filteredUsers);
          setIsLoading(false);
        } else {
          setError("Unable to fetch user data");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Error fetching user data");
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminId");
    navigate('/cpc/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleAccordion = (userId: string) => {
    setOpenUserId(openUserId === userId ? null : userId);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://localhost:3005/api/deleteUser/${userId}`);
      setUsersData(prevUsers => prevUsers.filter(user => user.userId !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Error deleting user");
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredUsers = usersData.filter(user =>
    user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.useremail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // When admin clicks "Edit", open modal and set user data
  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Submit updated user data to API
  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!editingUser) return;
    
    if (!editingUser.userId || !editingUser.userName || !editingUser.useremail || !editingUser.userphone || !editingUser.date ) {
      alert("Please fill in all required fields.");
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:3005/api/updateUser', editingUser);
    
      if (response.status === 200) {
        setUsersData(prevUsers => prevUsers.map(user => user.userId === editingUser.userId ? editingUser : user));
        handleCloseModal();
      } else {
        console.error("Error updating user:", response);
        alert("Error updating user data.");
      }
    } catch (err) {
      console.error("Error during submission:", err);
      if (err.response) {
        alert(`Error: ${err.response.data.message || 'Unknown error'}`);
      } else if (err.request) {
        alert("No response from the server.");
      } else {
        alert("An unexpected error occurred.");
      }
    }
  };  

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#4F46E5"
                className="ml-2"
              >
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-6 h-6"
            >
              <path
                d="M16 13v-2H7V9h9V7l5 4-5 4zm-2 7H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8V2H6C4.346 2 3 3.346 3 5v14c0 1.654 1.346 3 3 3h8v-2z"
              />
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
<SendEmail />


        

        <h1 className="text-3xl font-semibold text-indigo-600 text-center my-8">ข้อมูล Users</h1>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="ค้นหา..."
          className="p-2 border border-gray-300 rounded-md mb-6"
        />

        {filteredUsers.map(user => (
          <div key={user.userId} className="bg-white shadow-lg p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold text-indigo-800 cursor-pointer" onClick={() => toggleAccordion(user.userId)}>
              {user.userId} {openUserId === user.userId ? "▲" : "▼"}
            </h3>
            {openUserId === user.userId && (
              <div>
                <p className="text-black font-semibold">User Number: {user.userId}</p>
                <p className="text-black font-semibold">Name: {user.userName}</p>
                <p className="text-black font-semibold">Email: {user.useremail}</p>
                <p className="text-black font-semibold">Phone: {user.userphone}</p>
                <p className="text-black font-semibold">Date of Birth: {user.date}</p>
                <button onClick={() => handleDelete(user.userId)} className="bg-red-500 text-white px-4 py-2 rounded mt-4">
                  Delete
                </button>
                <button onClick={() => handleEditClick(user)} className="bg-blue-500 text-white px-4 py-2 rounded mt-4 ml-4">
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Modal for Editing User */}
        {isModalOpen && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg transform transition-all duration-500 scale-100">
              <h3 className="text-xl font-semibold text-indigo-700 mb-4">Edit User</h3>
              <form onSubmit={handleEditSubmit}>
                <label className="block mb-2 text-black font-semibold">User Number:</label>
                <input
                  type="text"
                  value={editingUser?.userId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, userId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mb-4"
                  disabled
                />
                <label className="block mb-2 text-black font-semibold">Name:</label>
                <input
                  type="text"
                  value={editingUser?.userName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, userName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mb-4"
                />
                <label className="block mb-2 text-black font-semibold">Email:</label>
                <input
                  type="email"
                  value={editingUser?.useremail || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, useremail: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mb-4"
                />
                <label className="block mb-2 text-black font-semibold">Phone:</label>
                <input
                  type="text"
                  value={editingUser?.userphone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, userphone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mb-4"
                />
                <label className="block mb-2 text-black font-semibold">Date of Birth:</label>
                <input
                  type="date"
                  value={editingUser?.date || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mb-4"
                />
                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded">
                    Cancel
                  </button>
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DetailUser;
