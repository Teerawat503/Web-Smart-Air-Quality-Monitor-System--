import React, { useState } from "react";

const HeaderUser = () => {
  const [menuOpens, setMenuOpens] = useState(false); // State for controlling menu visibility

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <h1 className="text-3xl font-extrabold tracking-wide text-white hover:text-indigo-100 transition-colors duration-300 font-sans">
          CPC_PM2.5
        </h1>

        {/* Hamburger Menu for mobile */}
        <button
          className="md:hidden block focus:outline-none"
          onClick={() => setMenuOpens(!menuOpens)} // Toggle menu visibility
        >
          <svg
            className={`w-6 h-6 transform transition-transform duration-300 ${
              menuOpens ? "rotate-90" : ""
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
        <nav
          className={`md:flex md:items-center md:space-x-8 ${
            menuOpens ? "block" : "hidden"
          } transition-all duration-300 ease-in-out`}
        >
          <ul className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 text-sm md:text-base p-6 md:p-0">
            <li>
              <a
                href="/cpc/user/dashboard"
                className="relative group text-lg font-semibold hover:text-purple-200 transition-colors duration-500"
              >
                หน้าแรก
                <span className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-all duration-300 transform origin-left"></span>
              </a>
            </li>
            <li>
              <a
                href="/cpc/user/pmapi"
                className="relative group text-lg font-semibold hover:text-indigo-200 transition-colors duration-300"
              >
                ภาพรวม
                <span className="absolute bottom-0 left-0 w-full h-1 bg-indigo-200 scale-x-0 group-hover:scale-x-100 transition-all duration-300 transform origin-left"></span>
              </a>
            </li>
            <li>
              <a
                href="/cpc/user/rankpm"
                className="relative group text-lg font-semibold hover:text-indigo-200 transition-colors duration-300"
              >
                อันดับค่าฝุ่น PM2.5
                <span className="absolute bottom-0 left-0 w-full h-1 bg-indigo-200 scale-x-0 group-hover:scale-x-100 transition-all duration-300 transform origin-left"></span>
              </a>
            </li>
            <li>
              <a
                href="/cpc/user/contact"
                className="relative group text-lg font-semibold hover:text-indigo-200 transition-colors duration-300"
              >
                ติดต่อเรา
                <span className="absolute bottom-0 left-0 w-full h-1 bg-indigo-200 scale-x-0 group-hover:scale-x-100 transition-all duration-300 transform origin-left"></span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default HeaderUser;
