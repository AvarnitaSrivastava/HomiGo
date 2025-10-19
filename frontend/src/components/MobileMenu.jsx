import React, { useState } from 'react';
import './MobileMenu.css';

const MobileMenu = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="mobile-menu-overlay" onClick={onClose}>
      <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-menu-header">
          <h2>HomiGo</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <nav className="mobile-nav">
          <a href="/dashboard" className="mobile-nav-link">
            <span>🏠</span> Dashboard
          </a>
          <a href="/profile" className="mobile-nav-link">
            <span>👤</span> Profile
          </a>
          <a href="/matches" className="mobile-nav-link">
            <span>💕</span> My Matches
          </a>
          <a href="/listings" className="mobile-nav-link">
            <span>🏘️</span> Listings
          </a>
          <a href="/messages" className="mobile-nav-link">
            <span>💬</span> Messages
          </a>
          <a href="/settings" className="mobile-nav-link">
            <span>⚙️</span> Settings
          </a>
        </nav>
        
        <div className="mobile-menu-footer">
          <button className="mobile-logout-btn">
            <span>↗️</span> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
