import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import './Sidebar.css';



const Sidebar = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.slice(1) || 'owner-dashboard';

  
  // Support both controlled and uncontrolled usage
  const isControlled = typeof props.isCollapsed === 'boolean' && typeof props.setIsCollapsed === 'function';
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = isControlled ? props.isCollapsed : internalCollapsed;
  const setIsCollapsed = isControlled ? props.setIsCollapsed : setInternalCollapsed;

  const [userInfo] = useState({
    name: 'HomiGo',
    subtitle: authService.isOwner() ? 'PG Owner Portal' : 'Student Housing'
  });

  // Check if user is owner to show different navigation items
  const isOwner = authService.isOwner();

  // Navigation items for students
  const studentNavigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/dashboard' },
    { id: 'matches', label: 'My Matches', icon: '❤️', path: '/matches' },
    { id: 'hostels', label: 'Hostel Listings', icon: '🛏️', path: '/hostels' },
    { id: 'messages', label: 'Messages', icon: '💬', path: '/messages' },
    { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' }
  ];

  // Navigation items for owners
  const ownerNavigationItems = [
    { id: 'owner-dashboard', label: 'Dashboard', icon: '🏢', path: '/owner-dashboard' },
    { id: 'owner-profile', label: 'Profile', icon: '👤', path: '/owner-profile' },
    { id: 'owner-listings', label: 'My Listings', icon: '🏠', path: '/owner-listings' }
  ];

  // Select appropriate navigation items based on user type
  const navigationItems = isOwner ? ownerNavigationItems : studentNavigationItems;

  const quickActions = [
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings', type: 'link' },
    { id: 'logout', label: 'Logout', icon: '🚪', type: 'logout' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleQuickAction = async (action) => {
    if (action.type === 'logout') {
      // Use the authService logout method
      await authService.logout();
      navigate('/');
      return;
    }
    navigate(action.path);
  };

  // Update the logo click handler to navigate to appropriate dashboard
  const handleLogoClick = () => {
    const dashboardPath = isOwner ? '/owner-dashboard' : '/dashboard';
    handleNavigation(dashboardPath);
  };

  return (
    <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        <div className="sidebar-header">
          <div className="logo-container">
            <div 
              className="logo-icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              🏠
            </div>
            {!isCollapsed && (
              <div 
                className="logo-text"
                onClick={() => handleLogoClick()}
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleLogoClick();
                  }
                }}
              >
                <h1>{userInfo.name}</h1>
                <p>{userInfo.subtitle}</p>
              </div>
            )}
          </div>
        </div>

        <div className="nav-items">
          {/* Main navigation items excluding settings */}
          {navigationItems.filter(item => item.id !== 'settings').map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`nav-item ${currentPath === item.id ? 'active' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className={`nav-item ${action.type === 'logout' ? 'logout' : ''}`}
              title={isCollapsed ? action.label : ''}
            >
              <span className="nav-icon">{action.icon}</span>
              {!isCollapsed && <span className="nav-label">{action.label}</span>}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;