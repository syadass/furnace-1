import React from "react";

const Header = () => {
  const primaryColor = "#3674B5"; 

  return (
    <header className="bg-white shadow w-full h-[60px] flex items-center px-6 fixed top-0 left-0 z-20">
      <div className="flex items-center gap-3">
        <img 
          src="/assets/logo.jpg" 
          alt="Logo Fakultas" 
          className="w-8 h-8 object-contain" 
        />
        <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
            Fakultas Sains dan Teknologi
        </h1>
      </div>
    </header>
  );
};

export default Header;