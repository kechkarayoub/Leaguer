/**
 * Sidebar Component
 * 
 * Lateral navigation menu for authenticated users
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMenuItems } from '../../utils/UserUtils'; // Assuming you have a utility to get menu items
import useAuth from '../../hooks/useAuth';

import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = getMenuItems(user, t);

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <h2 className="sidebar__title">{t('navigation:menu')}</h2>
          <button 
            className="sidebar__close"
            onClick={onClose}
            aria-label={t('common:close')}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="sidebar__nav">
          <ul className="sidebar__menu">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.key} className="sidebar__menu-item">
                  <button
                    className={`sidebar__menu-link ${isActive(item.path) ? 'sidebar__menu-link--active' : ''}`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <IconComponent className="sidebar__menu-icon" size={20} />
                    <span className="sidebar__menu-text">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
