/**
 * MainFooter Component
 * 
 * Main application footer using AuthFooter with adapted styling for main layout
 */

import React from 'react';
import AuthFooter from '../AuthFooter';
import useAuth from '../../hooks/useAuth';

import './MainFooter.css';

const MainFooter: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="main-footer-wrapper">
      <AuthFooter 
        prefillUserData={{
          name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
          email: user?.email || ''
        }}
      />
    </div>
  );
};

export default MainFooter;
