import React, {useEffect, useState} from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../SideBar/SideBar';
import TopBar from '../TopBar/TopBar';
import './NavBarLayout.css'

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);
  
  return (
    <div className="sideBarLayout">
      <SideBar isCollapsed={isCollapsed} onToggle={toggleSidebar} className="sideBar" />
      <div className="topBarLayout">
        <TopBar className="topBar" />
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;