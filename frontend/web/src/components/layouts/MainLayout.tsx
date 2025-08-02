/**
 * MainLayout Component
 * 
 * Main application layout for authenticated users
 * Includes header, sidebar, footer, and main content area
 */

import React, { useState } from 'react';

import MainHeader from '../layout/MainHeader';
import MainFooter from '../layout/MainFooter';
import Sidebar from '../layout/Sidebar';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="main-layout">
      <MainHeader onMenuClick={handleToggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      <main className="main-layout__content">
        {children}
      </main>
      <MainFooter />
    </div>
  );
};

export default MainLayout;
