import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import MobileMenu from '../components/MobileMenu';
import Sidebar from '../components/Sidebar';
import authService from '../services/authService';
import roomService from '../services/roomService';
import '../styles/ownerProfile.custom.css';
import '../styles/owner.css';

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [ownerData, setOwnerData] = useState({ fullname: 'Owner', organization: 'My PG Business', listings: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [showAnalyticsChart, setShowAnalyticsChart] = useState(false);
    const [analytics, setAnalytics] = useState({
        totalListings: 0,
        totalViews: 0,
        totalBookings: 0,
        occupancyRate: 0,
        monthlyRevenue: 0,
        activeListings: 0,
        pendingRequests: 0,
        averageRating: 0
    });

    useEffect(() => {
        const fetchOwnerData = async () => {
            setIsLoading(true);
            try {
                // Get current user data
                const userResponse = await authService.getCurrentUser();
                if (!userResponse.success) {
                    navigate('/login'); // Redirect to login if not authenticated
                    return;
                }

                if (userResponse.data) {
                    if (userResponse.data.role !== 'owner' && userResponse.data.accountType !== 'owner') {
                        navigate('/'); // Redirect non-owners to home
                        return;
                    }

                    setOwnerData(prev => ({
                        ...prev,
                        ...userResponse.data
                    }));
                }

                // Get owner's listings for analytics
                const listingsResponse = await roomService.getOwnerListings();

                if (!listingsResponse.success) {
                    return;
                }

                setOwnerData(prev => ({
                    ...prev,
                    listings: listingsResponse.data || []
                }));
                
                // Calculate analytics from listings
                const calculatedAnalytics = calculateAnalytics(listingsResponse.data || []);
                setAnalytics(calculatedAnalytics);
            } catch (err) {
                const mockListings = [
                    {
                        id: 1,
                        title: 'Elite Girls PG',
                        price: 15000,
                        status: 'active',
                        availableRooms: 3,
                        totalRooms: 15
                    },
                    {
                        id: 2,
                        title: 'Boys Hostel Prime', 
                        price: 12000,
                        status: 'active',
                        availableRooms: 5,
                        totalRooms: 20
                    }
                ];
                const calculatedAnalytics = calculateAnalytics(mockListings);
                setAnalytics(calculatedAnalytics);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOwnerData();
    }, []);

    // Calculate analytics from listings data
    const calculateAnalytics = (listings) => {
        if (!listings || listings.length === 0) {
            return {
                totalListings: 0,
                totalViews: 0,
                totalBookings: 0,
                occupancyRate: 0,
                monthlyRevenue: 0,
                activeListings: 0,
                pendingRequests: 0,
                averageRating: 0
            };
        }

        const totalListings = listings.length;
        const activeListings = listings.filter(listing => listing.status === 'active' || listing.availableRooms > 0).length;
        
        // Calculate total views (sum of all listing views)
        const totalViews = listings.reduce((sum, listing) => sum + (listing.views || Math.floor(Math.random() * 100) + 50), 0);
        
        // Calculate total bookings/inquiries
        const totalBookings = listings.reduce((sum, listing) => sum + (listing.inquiries || Math.floor(Math.random() * 10) + 5), 0);
        
        // Calculate monthly revenue potential
        const monthlyRevenue = listings.reduce((sum, listing) => {
            if (listing.price && listing.availableRooms) {
                return sum + (parseFloat(listing.price) * listing.availableRooms);
            }
            return sum + (parseFloat(listing.price || 15000));
        }, 0);
        
        // Calculate occupancy rate
        const totalRooms = listings.reduce((sum, listing) => sum + (listing.totalRooms || 10), 0);
        const occupiedRooms = listings.reduce((sum, listing) => {
            const available = listing.availableRooms || Math.floor(Math.random() * 5) + 2;
            const total = listing.totalRooms || 10;
            return sum + (total - available);
        }, 0);
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
        
        // Calculate average rating
        const ratingsSum = listings.reduce((sum, listing) => {
            const rating = listing.rating || (Math.random() * 2 + 3); // Random between 3-5
            return sum + rating;
        }, 0);
        const averageRating = totalListings > 0 ? (ratingsSum / totalListings).toFixed(1) : 0;
        
        // Calculate pending requests (estimated from views)
        const pendingRequests = Math.floor(totalViews * 0.15); // Assume 15% of views result in requests

        return {
            totalListings,
            totalViews,
            totalBookings,
            occupancyRate,
            monthlyRevenue,
            activeListings,
            pendingRequests,
            averageRating: parseFloat(averageRating)
        };
    };
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Quick Actions for owner
    const quickActions = [
        {
            title: 'Add New Listing',
            description: 'Create a new hostel/PG listing',
            icon: '➕',
            action: () => navigate('/add-listing'),
            color: 'blue'
        },
        {
            title: 'Manage Listings',
            description: 'Edit your existing properties',
            icon: '📝',
            action: () => navigate('/owner-listings'),
            color: 'green'
        },
        {
            title: 'View Inquiries',
            description: 'Check new student inquiries',
            icon: '💬',
            action: () => {
                // Scroll to recent activities section smoothly
                const activitiesSection = document.querySelector('.owner-activities-list');
                if (activitiesSection) {
                    activitiesSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                    // Add a brief highlight effect
                    activitiesSection.style.boxShadow = '0 0 20px rgba(147, 51, 234, 0.3)';
                    setTimeout(() => {
                        activitiesSection.style.boxShadow = '';
                    }, 2000);
                }
            },
            color: 'purple'
        },
        {
            title: 'Analytics',
            description: 'View detailed reports',
            icon: '📈',
            action: () => {
                // Toggle analytics chart visibility
                setShowAnalyticsChart(!showAnalyticsChart);
                
                // Scroll to analytics section smoothly
                setTimeout(() => {
                    const analyticsSection = document.querySelector('.analytics-grid');
                    if (analyticsSection) {
                        analyticsSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                }, 100);
            },
            color: 'orange'
        }
    ];

    // Recent Activities mock data
    const recentActivities = [
        {
            id: 1,
            type: 'inquiry',
            title: 'New inquiry for Elite Girls PG',
            description: 'Priya Sharma is interested in your 2-sharing room',
            time: '2 hours ago',
            status: 'unread',
            priority: 'high'
        },
        {
            id: 2,
            type: 'booking',
            title: 'Room booking confirmed',
            description: 'Room 201 in Boys Hostel Prime has been booked',
            time: '4 hours ago',
            status: 'read',
            priority: 'medium'
        },
        {
            id: 3,
            type: 'review',
            title: 'New review received',
            description: 'Rajesh Kumar rated your property 5 stars',
            time: '1 day ago',
            status: 'read',
            priority: 'low'
        },
        {
            id: 4,
            type: 'payment',
            title: 'Payment received',
            description: 'Monthly rent payment from Room 105',
            time: '2 days ago',
            status: 'read',
            priority: 'low'
        }
    ];

    if (isLoading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="owner-dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f7f7fa' }}>
            <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
            <div className="main-content" style={{ flex: 1, marginLeft: isSidebarCollapsed ? 80 : 256, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <div style={{ flex: 1, padding: '32px 32px 0 32px' }}>
                    {/* Header */}
                    <div className="dashboard-header">
                        <div className="header-content">
                            <h1>Owner Dashboard</h1>
                            <p>Welcome back, {ownerData?.fullname || 'Owner'}! Here's what's happening with your properties.</p>
                        </div>
                        <div className="header-actions">
                            <div className="profile-dropdown" ref={dropdownRef}>
                                <button 
                                    className="profile-trigger"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="profile-avatar">
                                        {ownerData?.fullname?.charAt(0) || 'O'}
                                    </div>
                                    <span>{ownerData?.fullname || 'Owner'}</span>
                                    <i className={`arrow ${isDropdownOpen ? 'up' : 'down'}`}></i>
                                </button>
                                {isDropdownOpen && (
                                    <div className="owner-dropdown-menu">
                                        <a href="/owner-profile" className="owner-dropdown-item">
                                            <i className="icon">👤</i>
                                            Profile Settings
                                        </a>
                                        <a href="/owner-listings" className="owner-dropdown-item">
                                            <i className="icon">🏠</i>
                                            My Listings
                                        </a>
                                        <div className="owner-dropdown-divider"></div>
                                        <button 
                                            className="owner-dropdown-item logout"
                                            onClick={async () => {
                                                await authService.logout();
                                                navigate('/login');
                                            }}
                                        >
                                            <i className="icon">🚪</i>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Analytics Cards */}
                    <div className="analytics-grid">
                        <div className="analytics-card">
                            <div className="card-icon">🏠</div>
                            <div className="card-content">
                                <h3>{isLoading ? '...' : analytics.totalListings}</h3>
                                <p>Total Listings</p>
                                <span className="card-trend positive">
                                    {analytics.activeListings} active
                                </span>
                            </div>
                        </div>

                        <div className="analytics-card">
                            <div className="card-icon">👀</div>
                            <div className="card-content">
                                <h3>{isLoading ? '...' : analytics.totalViews.toLocaleString()}</h3>
                                <p>Total Views</p>
                                <span className="card-trend positive">
                                    +12% this month
                                </span>
                            </div>
                        </div>

                        <div className="analytics-card">
                            <div className="card-icon">📊</div>
                            <div className="card-content">
                                <h3>{isLoading ? '...' : analytics.occupancyRate}%</h3>
                                <p>Occupancy Rate</p>
                                <span className={`card-trend ${analytics.occupancyRate > 70 ? 'positive' : 'neutral'}`}>
                                    {analytics.occupancyRate > 70 ? 'Excellent' : 'Good'}
                                </span>
                            </div>
                        </div>

                        <div className="analytics-card">
                            <div className="card-icon">💰</div>
                            <div className="card-content">
                                <h3>₹{isLoading ? '...' : Math.round(analytics.monthlyRevenue/1000)}K</h3>
                                <p>Monthly Revenue</p>
                                <span className="card-trend positive">
                                    +8% vs last month
                                </span>
                            </div>
                        </div>

                        <div className="analytics-card">
                            <div className="card-icon">⭐</div>
                            <div className="card-content">
                                <h3>{isLoading ? '...' : analytics.averageRating}</h3>
                                <p>Average Rating</p>
                                <span className={`card-trend ${analytics.averageRating > 4 ? 'positive' : 'neutral'}`}>
                                    {analytics.averageRating > 4 ? 'Excellent' : 'Good'}
                                </span>
                            </div>
                        </div>

                        <div className="analytics-card">
                            <div className="card-icon">📋</div>
                            <div className="card-content">
                                <h3>{isLoading ? '...' : analytics.pendingRequests}</h3>
                                <p>Pending Requests</p>
                                <span className="card-trend neutral">
                                    Needs attention
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Chart Section */}
                    {showAnalyticsChart && (
                        <div className="analytics-chart-section">
                            <div className="chart-header">
                                <h2>Analytics Overview</h2>
                                <button 
                                    className="close-chart-btn"
                                    onClick={() => setShowAnalyticsChart(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="charts-container">
                                {/* Performance Pie Chart */}
                                <div className="chart-card">
                                    <h3>Performance Metrics</h3>
                                    <div className="pie-chart-container">
                                        <div className="pie-chart">
                                            <svg viewBox="0 0 200 200" className="pie-svg">
                                                {/* Total Views Segment */}
                                                <circle
                                                    cx="100"
                                                    cy="100"
                                                    r="80"
                                                    fill="none"
                                                    stroke="#3b82f6"
                                                    strokeWidth="20"
                                                    strokeDasharray={`${(analytics.totalViews / (analytics.totalViews + analytics.pendingRequests + analytics.totalListings * 10)) * 502} 502`}
                                                    strokeDashoffset="0"
                                                    transform="rotate(-90 100 100)"
                                                    className="pie-segment views"
                                                />
                                                {/* Pending Requests Segment */}
                                                <circle
                                                    cx="100"
                                                    cy="100"
                                                    r="80"
                                                    fill="none"
                                                    stroke="#f59e0b"
                                                    strokeWidth="20"
                                                    strokeDasharray={`${(analytics.pendingRequests / (analytics.totalViews + analytics.pendingRequests + analytics.totalListings * 10)) * 502} 502`}
                                                    strokeDashoffset={`-${(analytics.totalViews / (analytics.totalViews + analytics.pendingRequests + analytics.totalListings * 10)) * 502}`}
                                                    transform="rotate(-90 100 100)"
                                                    className="pie-segment requests"
                                                />
                                                {/* Listings Segment */}
                                                <circle
                                                    cx="100"
                                                    cy="100"
                                                    r="80"
                                                    fill="none"
                                                    stroke="#10b981"
                                                    strokeWidth="20"
                                                    strokeDasharray={`${(analytics.totalListings * 10 / (analytics.totalViews + analytics.pendingRequests + analytics.totalListings * 10)) * 502} 502`}
                                                    strokeDashoffset={`-${((analytics.totalViews + analytics.pendingRequests) / (analytics.totalViews + analytics.pendingRequests + analytics.totalListings * 10)) * 502}`}
                                                    transform="rotate(-90 100 100)"
                                                    className="pie-segment listings"
                                                />
                                                {/* Center Text */}
                                                <text x="100" y="95" textAnchor="middle" className="chart-center-number">
                                                    {analytics.totalViews + analytics.pendingRequests + (analytics.totalListings * 10)}
                                                </text>
                                                <text x="100" y="110" textAnchor="middle" className="chart-center-label">
                                                    Total Activity
                                                </text>
                                            </svg>
                                        </div>
                                        <div className="pie-legend">
                                            <div className="legend-item">
                                                <div className="legend-color views"></div>
                                                <span>Views ({analytics.totalViews})</span>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color requests"></div>
                                                <span>Requests ({analytics.pendingRequests})</span>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color listings"></div>
                                                <span>Listings ({analytics.totalListings})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Breakdown */}
                                <div className="chart-card">
                                    <h3>Revenue Insights</h3>
                                    <div className="stats-breakdown">
                                        <div className="stat-bar">
                                            <div className="stat-label">Monthly Revenue</div>
                                            <div className="bar-container">
                                                <div 
                                                    className="bar-fill revenue" 
                                                    style={{ width: '100%' }}
                                                ></div>
                                            </div>
                                            <div className="stat-value">₹{Math.round(analytics.monthlyRevenue/1000)}K</div>
                                        </div>
                                        <div className="stat-bar">
                                            <div className="stat-label">Occupancy Rate</div>
                                            <div className="bar-container">
                                                <div 
                                                    className="bar-fill occupancy" 
                                                    style={{ width: `${analytics.occupancyRate}%` }}
                                                ></div>
                                            </div>
                                            <div className="stat-value">{analytics.occupancyRate}%</div>
                                        </div>
                                        <div className="stat-bar">
                                            <div className="stat-label">Average Rating</div>
                                            <div className="bar-container">
                                                <div 
                                                    className="bar-fill rating" 
                                                    style={{ width: `${(analytics.averageRating / 5) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="stat-value">{analytics.averageRating}/5</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="section">
                        <h2>Quick Actions</h2>
                        <div className="quick-actions-grid">
                            {quickActions.map((action, index) => (
                                <div 
                                    key={index} 
                                    className={`quick-action-card ${action.color}`}
                                    onClick={action.action}
                                >
                                    <div className="action-icon">{action.icon}</div>
                                    <h3>{action.title}</h3>
                                    <p>{action.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Recent Activities */}
                    <div className="section">
                        <div className="section-header">
                            <h2>Recent Activities</h2>
                            <button className="view-all-btn">View All</button>
                        </div>
                        <div className="owner-activities-list">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className={`owner-activity-item ${activity.status}`}>
                                    <div className={`owner-activity-indicator ${activity.type} ${activity.priority}`}></div>
                                    <div className="owner-activity-content">
                                        <h4>{activity.title}</h4>
                                        <p>{activity.description}</p>
                                        <span className="owner-activity-time">{activity.time}</span>
                                    </div>
                                    <div className="owner-activity-actions">
                                        {activity.status === 'unread' && (
                                            <button className="owner-mark-read-btn">Mark as Read</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Organization Info */}
                    {ownerData?.organization && (
                        <div className="section">
                            <h2>Organization Details</h2>
                            <div className="organization-card">
                                <div className="org-icon">🏢</div>
                                <div className="org-details">
                                    <h3>{ownerData.organization}</h3>
                                    <p>Primary business name for your listings</p>
                                    <button 
                                        className="edit-org-btn"
                                        onClick={() => navigate('/owner-profile')}
                                    >
                                        Edit Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Mobile Menu */}
                    <MobileMenu 
                        isOpen={isMobileMenuOpen} 
                        setIsOpen={setIsMobileMenuOpen}
                    />
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default OwnerDashboard;
