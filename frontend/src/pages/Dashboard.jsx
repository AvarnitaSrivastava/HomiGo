import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import MobileMenu from '../components/MobileMenu';
import Sidebar from '../components/Sidebar';
import authService from '../services/authService';
import roomService from '../services/roomService';
import matchService from '../services/matchService';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [personalizedStats, setPersonalizedStats] = useState(null);
  const [showAnalyticsChart, setShowAnalyticsChart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPotentialMatches = async () => {
    try {
      const matches = await matchService.getMatches();
      return matches.filter(match => match.compatibility >= 60);
    } catch (error) {
      return [];
    }
  };

  const fetchUserData = async () => {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        const userResponse = await authService.getCurrentUser();
        
        if (userResponse.success && userResponse.data) {
          // Update user state with fresh data from backend
          setUser(userResponse.data);
          
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(userResponse.data));
          
          // Fetch personalized stats with fresh user data
          await fetchPersonalizedStats(userResponse.data);
        } else {
          // Fallback to stored data if backend call fails
          const stored = localStorage.getItem('user');
          if (stored) {
            const userData = JSON.parse(stored);
            setUser(userData);
            await fetchPersonalizedStats(userData);
          } else {
            navigate('/login');
          }
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        
        // Try fallback to localStorage on other errors
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const userData = JSON.parse(stored);
            setUser(userData);
            setPersonalizedStats(getDefaultStats());
          } else {
            navigate('/login');
          }
        } catch (fallbackError) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    fetchFeaturedHostels(); // Fetch featured hostels from database
  }, []);

    const fetchFeaturedHostels = async () => {
    try {
      setFeaturedLoading(true);
      const response = await roomService.getRooms({ 
        limit: 3, // Get only 3 featured properties for dashboard
        sortBy: 'featured', // Sort by featured properties first
        status: 'available' // Only available properties
      });
      
      if (response.success && response.data) {
        // Filter for featured properties or get top-rated ones
        let featured = response.data.filter(room => room.featured);
        
        // If not enough featured properties, add top-rated ones
        if (featured.length < 3) {
          const remaining = response.data
            .filter(room => !room.featured)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3 - featured.length);
          featured = [...featured, ...remaining];
        }
        
        // Transform data to match the expected format
        const transformedData = featured.slice(0, 3).map(room => ({
          id: room.id,
          name: room.title || room.name || `${room.propertyType || 'Property'} in ${room.location}`,
          image: room.image || room.images?.[0] || '/images/no-image.png',
          rating: room.rating || 4.0,
          distance: room.distance || `${Math.random() * 2 + 0.5}`.substring(0, 3) + ' km from college',
          price: room.price || `₹${room.rent || '8,000'}/month`,
          availability: room.availability || 'Available now',
          amenities: room.amenities || ['Wi-Fi', 'Food', 'AC'],
          label: room.featured ? 'Featured' : room.compatibility > 80 ? 'Perfect Match' : 'Popular',
          labelColor: room.featured ? 'blue' : room.compatibility > 80 ? 'green' : 'orange'
        }));
        
        setFeaturedHostels(transformedData);
      }
    } catch (error) {
      console.error('Error fetching featured hostels:', error);
      // Fallback to empty array or show error message
      setFeaturedHostels([]);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const fetchPersonalizedStats = async (userData) => {
    try {
      // Get rooms data for personalized stats calculation
      const roomsResponse = await roomService.getRooms();
      
      if (roomsResponse.success) {
        const calculatedStats = await calculatePersonalizedStats(
          userData, 
          roomsResponse.data
        );
        setPersonalizedStats(calculatedStats);
      } else {
        setPersonalizedStats(getDefaultStats());
      }
    } catch (error) {
      setPersonalizedStats(getDefaultStats());
    }
  };

  const calculatePersonalizedStats = async (userData, availableRooms) => {
    // Get matches with compatibility scores
    let potentialMatches = [];
    try {
      try {
        potentialMatches = await matchService.getMatches();
        // Filter for high compatibility matches
        potentialMatches = potentialMatches.filter(match => match.compatibility >= 60);
      } catch (error) {
        potentialMatches = [];
      }
    } catch (error) {
    }

    // Calculate real stats based on user data and available rooms
    const userPreferences = userData.preferences || {};
    const userLocation = userData.location || '';
    const userBudget = userData.budget || 15000;
    
    // Filter rooms based on user preferences
    const matchingRooms = availableRooms.filter(room => {
      const priceMatch = !userBudget || room.price <= userBudget;
      const locationMatch = !userLocation || room.location?.toLowerCase().includes(userLocation.toLowerCase());
      const genderMatch = !userPreferences.gender || room.preferences?.gender === 'any' || room.preferences?.gender === userPreferences.gender;
      
      return priceMatch && locationMatch && genderMatch;
    });

    // Use actual number of potential matches
    const roommateMatches = potentialMatches.length;
    
    // Calculate viewed properties (from user activity or localStorage)
    const viewedProperties = userData.viewedProperties?.length || Math.floor(Math.random() * 10) + 5;
    
    // Calculate average rent in user's preferred area
    const avgRent = matchingRooms.length > 0 
      ? Math.round(matchingRooms.reduce((sum, room) => sum + room.price, 0) / matchingRooms.length)
      : userBudget;

    return {
      roommateMatches: {
        count: roommateMatches.toString(),
        new: `+${Math.floor(roommateMatches * 0.2)}`,
        subtitle: 'Potential Matches',
        secondaryText: 'Based on your preferences',
        trend: roommateMatches > 10 ? 'up' : 'neutral',
        trendValue: roommateMatches > 10 ? '15%' : '5%',
        icon: '👥'
      },
      availableHostels: {
        count: matchingRooms.length.toString(),
        subtitle: 'Available Properties',
        secondaryText: userLocation ? `In ${userLocation}` : 'Matching your criteria',
        trend: matchingRooms.length > 20 ? 'up' : 'neutral',
        trendValue: '8%',
        icon: '🏢'
      },
      viewedProperties: {
        count: viewedProperties.toString(),
        subtitle: 'Properties Viewed',
        secondaryText: 'Last 30 days',
        trend: 'neutral',
        icon: '👁️'
      },
      averageRent: {
        count: `₹${(avgRent/1000).toFixed(1)}K`,
        subtitle: 'Average Rent',
        secondaryText: userLocation ? `In ${userLocation}` : 'In your budget range',
        trend: avgRent < userBudget ? 'down' : 'up',
        trendValue: '3%',
        icon: '💰'
      }
    };
  };

  const getDefaultStats = () => {
    // Fallback stats if API fails
    return {
      roommateMatches: {
        count: '0',
        new: '+0',
        subtitle: 'Potential Matches',
        secondaryText: 'Based on your preferences',
        trend: 'neutral',
        trendValue: '0%',
        icon: '👥'
      },
      availableHostels: {
        count: '47',
        subtitle: 'Available Properties',
        secondaryText: 'Within 2km radius',
        trend: 'up',
        trendValue: '8%',
        icon: '🏢'
      },
      viewedProperties: {
        count: '15',
        subtitle: 'Properties Viewed',
        secondaryText: 'Last 30 days',
        trend: 'neutral',
        icon: '👁️'
      },
      averageRent: {
        count: '₹10.5K',
        subtitle: 'Average Rent',
        secondaryText: 'In your area',
        trend: 'down',
        trendValue: '3%',
        icon: '💰'
      }
    };
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [dropdownPos, setDropdownPos] = useState(null);

  const updateDropdownPos = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    // width of dropdown is 280px as per CSS
    const dropdownWidth = 280;
    const right = Math.min(window.innerWidth - 12, rect.right);
    const left = Math.max(12, right - dropdownWidth);
    const top = rect.bottom + 10; // 10px gap
    setDropdownPos({ left, top });
  };

  useEffect(() => {
    if (isDropdownOpen) updateDropdownPos();
    const onResize = () => {
      if (isDropdownOpen) updateDropdownPos();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [isDropdownOpen]);
  const [viewMode, setViewMode] = useState('grid');

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Temporarily disable Recent Activity fetching and real-time updates.
    // Intentionally leave the section blank (no API calls or sockets).
    setRecentActivity([]);
    return () => {};
  }, []);

  const [quickActions] = useState([
    {
      id: 1,
      title: 'Schedule Viewing',
      description: 'Book a visit to your preferred properties',
      icon: '📅',
      color: '#3B82F6',
      action: 'schedule'
    },
    {
      id: 2,
      title: 'Find Roommates',
      description: 'Browse compatible roommate profiles',
      icon: '👥',
      color: '#10B981',
      action: 'roommates'
    },
    {
      id: 3,
      title: 'Property Alerts',
      description: 'Set up notifications for new listings',
      icon: '🔔',
      color: '#8B5CF6',
      action: 'alerts'
    },
    {
      id: 4,
      title: 'Analytics',
      description: 'View your personalized housing insights',
      icon: '📈',
      color: '#F59E0B',
      action: 'analytics'
    }
  ]);

  const [featuredHostels, setFeaturedHostels] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'schedule':
        // Navigate to hostels page to schedule viewings
        navigate('/hostels');
        break;
      case 'roommates':
        // Navigate to matches/roommates page
        navigate('/matches');
        break;
      case 'alerts':
        // Scroll to recent activity section to see property alerts
        const activitySection = document.querySelector('.recent-activity');
        if (activitySection) {
          activitySection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          // Add a brief highlight effect
          activitySection.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.3)';
          setTimeout(() => {
            activitySection.style.boxShadow = '';
          }, 2000);
        }
        break;
      case 'analytics':
        // Toggle analytics chart visibility
        setShowAnalyticsChart(!showAnalyticsChart);
        
        // Scroll to stats section smoothly
        setTimeout(() => {
          const statsSection = document.querySelector('.stats-section');
          if (statsSection) {
            statsSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 100);
        break;
      default:
        break;
    }
  };

  const handleHostelAction = (hostelId, action) => {
    if (action === 'view') {
      navigate(`/hostel/${hostelId}`);
    } else if (action === 'save') {
      // Handle save functionality
      // TODO: Implement save functionality
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to listings page with search query
      navigate(`/listings?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      // If no search term, just navigate to listings page
      navigate('/listings');
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="main-content">
        <div className="dashboard-container">
          {/* Header Section */}
          <header className="dashboard-header">
            <div className="header-content">
              <h1>Find Your Perfect Place</h1>
              <form className="search-bar" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search for locations, properties, or amenities..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="search-btn">
                  <span className="icon">🔍</span>
                  Search
                </button>
              </form>
            </div>
            <div className="header-actions">
              <button className="notification-btn">
                <span className="icon">�</span>
                <span className="badge">3</span>
              </button>
              <div className="user-menu">
                <div
                  className="user-menu-trigger"
                  ref={triggerRef}
                  onClick={() => { setIsDropdownOpen(!isDropdownOpen); if (!isDropdownOpen) updateDropdownPos(); }}
                >
                  <img
                    src={user?.profileImage || '/images/default-avatar.svg'}
                    alt={user?.name || 'User Avatar'}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = '/images/default-avatar.svg';
                    }}
                  />
                  <span className="user-name">
                    {isLoading ? 'Loading...' : (user?.name || 'User')}
                  </span>
                </div>
                {isDropdownOpen && (
                  <div className={`user-dropdown ${dropdownPos ? 'fixed' : ''}`} style={dropdownPos ? { left: dropdownPos.left, top: dropdownPos.top, position: 'fixed' } : {}} ref={dropdownRef}>
                    <div className="dropdown-header">
                      <img
                        src={user?.profileImage || '/images/default-avatar.svg'}
                        alt={user?.name || 'User Avatar'}
                        className="dropdown-avatar"
                        onError={(e) => {
                          e.target.src = '/images/default-avatar.svg';
                        }}
                      />
                      <div className="dropdown-user-info">
                        <span className="dropdown-name">
                          {isLoading ? 'Loading...' : (user?.name || 'User')}
                        </span>
                        <span className="dropdown-email">
                          {isLoading ? 'Loading...' : (user?.email || 'No email available')}
                        </span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-menu">
                      <button className="dropdown-item" onClick={() => navigate('/profile')}>
                        <span className="item-icon">👤</span>
                        My Profile
                      </button>
                      <button className="dropdown-item">
                        <span className="item-icon">⚙️</span>
                        Settings
                      </button>
                      <button className="dropdown-item">
                        <span className="item-icon">🔒</span>
                        Privacy
                      </button>
                      <div className="dropdown-divider"></div>
                      <button 
                        className="dropdown-item logout"
                        onClick={() => navigate('/')}
                      >
                        <span className="item-icon">🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="dashboard-main-section">
            <div className="main-grid">
              {/* Stats Overview */}
          <section className="stats-section">
            {showAnalyticsChart ? (
              // Analytics Chart View
              <div className="student-analytics-section">
                <div className="chart-header">
                  <h2>Your Housing Analytics</h2>
                  <button 
                    className="close-chart-btn"
                    onClick={() => setShowAnalyticsChart(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="student-charts-container">
                  {/* Property Search Pie Chart */}
                  <div className="student-chart-card">
                    <h3>Search Activity</h3>
                    <div className="student-pie-chart-container">
                      <div className="student-pie-chart">
                        <svg viewBox="0 0 200 200" className="student-pie-svg">
                          {/* Roommate Matches Segment */}
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="20"
                            strokeDasharray={`${personalizedStats ? (parseInt(personalizedStats.roommateMatches.count) / (parseInt(personalizedStats.roommateMatches.count) + parseInt(personalizedStats.availableHostels.count) + parseInt(personalizedStats.viewedProperties.count))) * 502 : 0} 502`}
                            strokeDashoffset="0"
                            transform="rotate(-90 100 100)"
                            className="student-pie-segment roommates"
                          />
                          {/* Available Properties Segment */}
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="20"
                            strokeDasharray={`${personalizedStats ? (parseInt(personalizedStats.availableHostels.count) / (parseInt(personalizedStats.roommateMatches.count) + parseInt(personalizedStats.availableHostels.count) + parseInt(personalizedStats.viewedProperties.count))) * 502 : 0} 502`}
                            strokeDashoffset={`-${personalizedStats ? (parseInt(personalizedStats.roommateMatches.count) / (parseInt(personalizedStats.roommateMatches.count) + parseInt(personalizedStats.availableHostels.count) + parseInt(personalizedStats.viewedProperties.count))) * 502 : 0}`}
                            transform="rotate(-90 100 100)"
                            className="student-pie-segment properties"
                          />
                          {/* Viewed Properties Segment */}
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="20"
                            strokeDasharray={`${personalizedStats ? (parseInt(personalizedStats.viewedProperties.count) / (parseInt(personalizedStats.roommateMatches.count) + parseInt(personalizedStats.availableHostels.count) + parseInt(personalizedStats.viewedProperties.count))) * 502 : 0} 502`}
                            strokeDashoffset={`-${personalizedStats ? ((parseInt(personalizedStats.roommateMatches.count) + parseInt(personalizedStats.availableHostels.count)) / (parseInt(personalizedStats.roommateMatches.count) + parseInt(personalizedStats.availableHostels.count) + parseInt(personalizedStats.viewedProperties.count))) * 502 : 0}`}
                            transform="rotate(-90 100 100)"
                            className="student-pie-segment viewed"
                          />
                          {/* Center Text */}
                          <text x="100" y="95" textAnchor="middle" className="student-chart-center-number" transform="rotate(0 100 100)">
                            {personalizedStats ? parseInt(personalizedStats.roommateMatches.count) + parseInt(personalizedStats.availableHostels.count) + parseInt(personalizedStats.viewedProperties.count) : 0}
                          </text>
                          <text x="100" y="110" textAnchor="middle" className="student-chart-center-label" transform="rotate(0 100 100)">
                            Total Activity
                          </text>
                        </svg>
                      </div>
                      <div className="student-pie-legend">
                        <div className="student-legend-item">
                          <div className="student-legend-color roommates"></div>
                          <span>Roommate Matches ({personalizedStats?.roommateMatches.count || 0})</span>
                        </div>
                        <div className="student-legend-item">
                          <div className="student-legend-color properties"></div>
                          <span>Available Properties ({personalizedStats?.availableHostels.count || 0})</span>
                        </div>
                        <div className="student-legend-item">
                          <div className="student-legend-color viewed"></div>
                          <span>Properties Viewed ({personalizedStats?.viewedProperties.count || 0})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget Analysis */}
                  <div className="student-chart-card">
                    <h3>Budget Analysis</h3>
                    <div className="student-stats-breakdown">
                      <div className="student-stat-bar">
                        <div className="student-stat-label">Average Rent in Area</div>
                        <div className="student-bar-container">
                          <div 
                            className="student-bar-fill budget" 
                            style={{ width: '100%' }}
                          ></div>
                        </div>
                        <div className="student-stat-value">{personalizedStats?.averageRent.count || 'N/A'}</div>
                      </div>
                      <div className="student-stat-bar">
                        <div className="student-stat-label">Available Properties</div>
                        <div className="student-bar-container">
                          <div 
                            className="student-bar-fill availability" 
                            style={{ width: `${personalizedStats ? Math.min((parseInt(personalizedStats.availableHostels.count) / 50) * 100, 100) : 0}%` }}
                          ></div>
                        </div>
                        <div className="student-stat-value">{personalizedStats?.availableHostels.count || 0} properties</div>
                      </div>
                      <div className="student-stat-bar">
                        <div className="student-stat-label">Search Activity</div>
                        <div className="student-bar-container">
                          <div 
                            className="student-bar-fill activity" 
                            style={{ width: `${personalizedStats ? Math.min((parseInt(personalizedStats.viewedProperties.count) / 20) * 100, 100) : 0}%` }}
                          ></div>
                        </div>
                        <div className="student-stat-value">{personalizedStats?.viewedProperties.count || 0} viewed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Regular Stats View
              <>
                {isLoading ? (
                  <div className="stats-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your personalized stats...</p>
                  </div>
                ) : personalizedStats ? (
                  <div className="stats-grid">
                    {Object.entries(personalizedStats).map(([key, stat]) => (
                      <div key={key} className="stat-card">
                        <div className="stat-icon-wrapper">{stat.icon}</div>
                        <div className="stat-content">
                          <div className="stat-header">
                            <h3 className="stat-count">{stat.count}</h3>
                            {stat.new && <span className="stat-new">+{stat.new.replace('+', '')}</span>}
                            {stat.trend && stat.trendValue && (
                              <span className={`stat-trend ${stat.trend}`}>{stat.trendValue}</span>
                            )}
                          </div>
                          <p className="stat-subtitle">{stat.subtitle}</p>
                          <p className="stat-secondary">{stat.secondaryText}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="stats-error">
                    <p>Unable to load stats. Please try again later.</p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Quick Actions */}
              <section className="quick-actions">
                <div className="section-header">
                  <h2>Quick Actions</h2>
                  <p>Get started with these common tasks</p>
                </div>
                <div className="actions-grid">
                  {quickActions.map(action => (
                    <button
                      key={action.id}
                      className="action-card"
                      onClick={() => handleQuickAction(action.action)}
                      style={{ '--action-color': action.color }}
                    >
                      <div className="action-icon">{action.icon}</div>
                      <div className="action-content">
                        <h3>{action.title}</h3>
                        <p>{action.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Recent Activity Section */}
            <section className="recent-activity">
              <div className="section-header">
                <h2>Recent Activity</h2>
                <p>Latest updates and notifications</p>
              </div>
              <div className="activity-list">
                {recentActivity.map(activity => (
                  <div
                    key={activity.id}
                    className={`activity-card ${activity.priority} ${activity.type}`}
                  >
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <h4>{activity.title}</h4>
                      <p>{activity.description}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Featured Hostels */}
          <section className="featured-hostels">
            <div className="section-header">
              <div className="section-title">
                <h2>Featured Properties</h2>
                <p>Handpicked places for you</p>
              </div>
              <div className="section-actions">
                <div className="view-options">
                  <button
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <span className="icon">📊</span>
                    Grid
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <span className="icon">📋</span>
                    List
                  </button>
                  <button
                    className="view-all-btn"
                    onClick={() => navigate('/hostels')}
                  >
                    <span className="icon">→</span>
                    View All Listings
                  </button>
                </div>
              </div>
            </div>

            <div className={`hostels-${viewMode}`}>
              {featuredLoading ? (
                <div className="featured-loading">
                  <div className="loading-grid">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="hostel-card loading">
                        <div className="hostel-image-skeleton"></div>
                        <div className="hostel-content-skeleton">
                          <div className="skeleton-line title"></div>
                          <div className="skeleton-line rating"></div>
                          <div className="skeleton-line detail"></div>
                          <div className="skeleton-line detail"></div>
                          <div className="skeleton-amenities">
                            <div className="skeleton-amenity"></div>
                            <div className="skeleton-amenity"></div>
                            <div className="skeleton-amenity"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : featuredHostels.length === 0 ? (
                <div className="no-featured-hostels">
                  <div className="no-data-message">
                    <span className="icon">🏠</span>
                    <h3>No featured properties available</h3>
                    <p>We're working on adding more amazing properties for you!</p>
                    <button
                      className="browse-all-btn"
                      onClick={() => navigate('/listings')}
                    >
                      Browse All Properties
                    </button>
                  </div>
                </div>
              ) : (
                featuredHostels.map(hostel => (
                  <div key={hostel.id} className="hostel-card">
                    <div 
                      className="hostel-image-container"
                      onClick={() => navigate(`/hostel/${hostel.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img 
                        src={hostel.image} 
                        alt={hostel.name} 
                        className="hostel-image"
                        onError={(e) => {
                          e.target.src = '/images/no-image.png';
                        }}
                      />
                      <div className={`hostel-label ${hostel.labelColor || ''}`}>{hostel.label}</div>
                    </div>

                    <div className="hostel-content">
                      <div className="hostel-header">
                        <div>
                          <h4 
                            onClick={() => navigate(`/hostel/${hostel.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            {hostel.name}
                          </h4>
                          <div className="rating">
                            <span className="stars">{'★'.repeat(Math.floor(hostel.rating))}{'☆'.repeat(5 - Math.floor(hostel.rating))}</span>
                            <span>{hostel.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="hostel-details">
                        <p className="hostel-distance">
                          <span className="icon">📍</span>
                          {hostel.distance}
                        </p>
                        <p className="hostel-price">
                          <span className="icon">💰</span>
                          {hostel.price}
                        </p>
                        <p className="availability">
                          <span className="icon">✨</span>
                          {hostel.availability}
                        </p>
                      </div>

                      <div className="dashboard-hostel-amenities">
                        {hostel.amenities.map((amenity, index) => (
                          <span key={index} className="dashboard-amenity">
                            <span className="dashboard-amenity-icon">
                              {amenity === 'Wi-Fi' && '📶'}
                              {amenity === 'Food' && '🍽️'}
                              {amenity === 'AC' && '❄️'}
                              {amenity === 'Laundry' && '🧺'}
                              {amenity === 'Gym' && '🏋️'}
                              {amenity === 'Parking' && '🅿️'}
                              {!['Wi-Fi', 'Food', 'AC', 'Laundry', 'Gym', 'Parking'].includes(amenity) && '✨'}
                            </span>
                            {amenity}
                          </span>
                        ))}
                      </div>

                      <div className="dashboard-hostel-actions">
                        <button
                          className="dashboard-save-btn"
                          onClick={() => handleHostelAction(hostel.id, 'save')}
                        >
                          <span className="icon">❤️</span>
                          Save
                        </button>
                        <button
                          className="dashboard-view-btn"
                          onClick={() => handleHostelAction(hostel.id, 'view')}
                        >
                          <span className="icon">👀</span>
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
          
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
