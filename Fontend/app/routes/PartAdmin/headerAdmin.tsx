import React, { useState } from "react";

interface HeaderAdminProps {
  adminId: string | null; // Define the prop type for adminId
}

const HeaderAdmin: React.FC<HeaderAdminProps> = ({ adminId }) => {
  const [menuOpen, setMenuOpen] = useState(false); // State for controlling menu visibility

  return (
    <header className="bg-indigo-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <h1 className="text-xl md:text-2xl font-bold tracking-wide">
          CPC_PM2.5
        </h1>

        {/* Hamburger Menu for mobile */}
        <button
          className="md:hidden block focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)} // Toggle menu visibility
        >
          <svg
            className={`w-6 h-6 transform transition-transform duration-300 ${
              menuOpen ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>

        {/* Navigation Menu */}
        <nav className={`md:flex md:items-center ${menuOpen ? "block" : "hidden"} transition-all duration-300 ease-in-out`}>
          <ul className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8 text-sm md:text-base p-6 md:p-0">
            <li>
              <a
                href={`/cpc/admin/dashboard/${adminId}`}
                className="hover:underline transition-colors duration-200"
              >
                หน้าแรก
              </a>
            </li>
            <li>
              <a
                href={`/cpc/admin/addiot/${adminId}`}
                className="hover:underline transition-colors duration-200"
              >
                เพิ่มอุปกรณ์
              </a>
            </li>
            <li>
              <a
                href={`/cpc/admin/pmapi/${adminId}`}
                className="hover:underline transition-colors duration-200"
              >
                ภาพรวม
              </a>
            </li>
            <li>
              <a
                href={`/cpc/admin/detailuser/${adminId}`}
                className="hover:underline transition-colors duration-200"
              >
                การแจ้งเตือน
              </a>
            </li>
            <li>
              <a
                href={`/cpc/admin/rankpm/${adminId}`}
                className="hover:underline transition-colors duration-200"
              >
                อันดับค่าฝุ่น PM2.5
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
    
  );
};

export default HeaderAdmin;
