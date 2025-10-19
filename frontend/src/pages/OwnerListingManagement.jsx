import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileMenu from '../components/MobileMenu';
import roomService from '../services/roomService';
import './Dashboard.css';
import './ListingCard.css';
import '../styles/ownerListings.custom.css';

const OwnerListingManagement = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);

  // Real data from backend
  const [myListings, setMyListings] = useState([]);
  const [otherListings, setOtherListings] = useState([]);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      try {
        // Fetch owner's listings
        const ownerResponse = await roomService.getOwnerListings();
        let myListingsArr = [];
        let ownerId = null;
        if (ownerResponse.success && Array.isArray(ownerResponse.data)) {
          myListingsArr = ownerResponse.data.map(roomService.transformListingData);
          setMyListings(myListingsArr);
          // Try to get ownerId from the first listing (assuming all have same owner)
          if (myListingsArr.length > 0 && myListingsArr[0].ownerId) {
            ownerId = myListingsArr[0].ownerId;
          }
        } else {
          setMyListings([]);
        }

        // Fetch all listings and filter out owner's
        const allResponse = await roomService.getRooms();
        if (allResponse.success && Array.isArray(allResponse.data)) {
          let allListings = allResponse.data.map(roomService.transformListingData);
          // Remove listings owned by this owner
          if (ownerId) {
            allListings = allListings.filter(listing => listing.ownerId !== ownerId);
          } else if (myListingsArr.length > 0) {
            // fallback: filter out by ids
            const myIds = new Set(myListingsArr.map(l => l.id));
            allListings = allListings.filter(listing => !myIds.has(listing.id));
          }
          setOtherListings(allListings);
        } else {
          setOtherListings([]);
        }
      } catch (err) {
        setMyListings([]);
        setOtherListings([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, []);

  const filteredListings = myListings.filter(listing => {
    const matchesTab = activeTab === 'all' || listing.status === activeTab;
    const matchesSearch = listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      case 'oldest':
        return new Date(a.lastUpdated) - new Date(b.lastUpdated);
      case 'price-high':
        return b.price - a.price;
      case 'price-low':
        return a.price - b.price;
      case 'views':
        return b.views - a.views;
      case 'inquiries':
        return b.inquiries - a.inquiries;
      default:
        return 0;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#f59e0b';
      case 'draft': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const handleStatusChange = (listingId, newStatus) => {
    setMyListings(prev => prev.map(listing =>
      listing.id === listingId ? { ...listing, status: newStatus } : listing
    ));
  };

  const handleDeleteListing = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        // Show loading state (you can add a loading indicator here if needed)
        const listingToDelete = myListings.find(listing => listing.id === listingId);
        
        // Call the API to delete from database
        await roomService.deleteRoom(listingId);
        
        // Remove from local state only after successful deletion
        setMyListings(prev => prev.filter(listing => listing.id !== listingId));
        
        // Show success message (optional)
        alert(`"${listingToDelete?.name || 'Listing'}" has been successfully deleted.`);
        
      } catch (error) {
        console.error('Error deleting listing:', error);
        // Show error message
        alert(`Failed to delete listing. ${error.message || 'Please try again.'}`);
      }
    }
  };

  // Add a summary bar for listings
  const summaryBar = (
    <div className="owner-listing-summary-bar">
      <div>Total Listings: <b>{!isNaN(myListings.length) ? myListings.length : 0}</b></div>
      <div>Active: <b>{!isNaN(myListings.filter(l => l.status === 'active').length) ? myListings.filter(l => l.status === 'active').length : 0}</b></div>
      <div>Occupancy: <b>{(() => {
        const totalRooms = myListings.reduce((acc, l) => acc + (!isNaN(l.totalRooms) && l.totalRooms !== undefined ? Number(l.totalRooms) : 0), 0);
        const occupiedRooms = myListings.reduce((acc, l) => acc + (!isNaN(l.occupiedRooms) && l.occupiedRooms !== undefined ? Number(l.occupiedRooms) : 0), 0);
        if (!totalRooms) return '0%';
        const percent = Math.round((occupiedRooms / totalRooms) * 100);
        return isNaN(percent) ? '0%' : percent + '%';
      })()}</b></div>
      <div>Revenue: <b>₹{(() => {
        const revenue = myListings.reduce((acc, l) => acc + (((!isNaN(l.price) && l.price !== undefined ? Number(l.price) : 0) * (!isNaN(l.occupiedRooms) && l.occupiedRooms !== undefined ? Number(l.occupiedRooms) : 0))), 0);
        return isNaN(revenue) ? '0' : revenue.toLocaleString();
      })()}</b></div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your listings...</p>
      </div>
    );
  }

  return (
    <div className="owner-listing-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f7f7fa' }}>
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="listing-main-content" style={{ flex: 1, marginLeft: 256, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1, padding: '32px 32px 0 32px' }}>
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1>Manage Listings</h1>
              <p>Create, edit, and manage your property listings</p>
            </div>
            <div className="header-actions">
              <button
                className="primary-btn"
                onClick={() => navigate('/add-listing')}
              >
                ➕ Add New Listing
              </button>
            </div>
          </div>

          {/* Summary Bar */}
          {summaryBar}

          {/* Quick Stats */}
          <div className="quick-stats-row">
            <div className="stat-item">
              <span className="stat-number">{!isNaN(myListings.filter(l => l.status === 'active').length) ? myListings.filter(l => l.status === 'active').length : 0}</span>
              <span className="stat-label">Active Listings</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{myListings.reduce((sum, l) => sum + (!isNaN(l.views) && l.views !== undefined ? Number(l.views) : 0), 0)}</span>
              <span className="stat-label">Total Views</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{myListings.reduce((sum, l) => sum + (!isNaN(l.inquiries) && l.inquiries !== undefined ? Number(l.inquiries) : 0), 0)}</span>
              <span className="stat-label">Total Inquiries</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{(() => {
                const ratings = myListings.filter(l => typeof l.rating === 'number' && !isNaN(l.rating) && l.rating > 0);
                if (!ratings.length) return '0';
                const avg = ratings.reduce((sum, l) => sum + (!isNaN(l.rating) && l.rating !== undefined ? Number(l.rating) : 0), 0) / ratings.length;
                const rounded = Math.round(avg * 10) / 10;
                return isNaN(rounded) ? '0' : String(rounded);
              })()}</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="listings-controls">
            <div className="tabs-container">
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All ({myListings.length})
                </button>
                <button
                  className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                  onClick={() => setActiveTab('active')}
                >
                  Active ({myListings.filter(l => l.status === 'active').length})
                </button>
                <button
                  className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
                  onClick={() => setActiveTab('inactive')}
                >
                  Inactive ({myListings.filter(l => l.status === 'inactive').length})
                </button>
                <button
                  className={`tab ${activeTab === 'draft' ? 'active' : ''}`}
                  onClick={() => setActiveTab('draft')}
                >
                  Drafts ({myListings.filter(l => l.status === 'draft').length})
                </button>
              </div>
            </div>

            <div className="search-and-sort">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="search-icon">🔍</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="views">Most Views</option>
                <option value="inquiries">Most Inquiries</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="listings-section">
            <h2 style={{ marginTop: 24 }}>My Listings</h2>
            <div className="listings-grid">
              {myListings.length === 0 ? (
                <div className="empty-state" key="empty-my-listings">
                  <div className="empty-icon">📋</div>
                  <h3>No listings found</h3>
                  <button
                    className="primary-btn"
                    onClick={() => navigate('/add-listing')}
                  >
                    Create Your First Listing
                  </button>
                </div>
              ) : (
                myListings.map(listing => (
                  <div key={listing.id || listing._id || listing.title || Math.random()} className="owner-listing-card">
                    <div className="listing-image">
                      <img src={listing.image} alt={listing.name} />
                      <div className="listing-status">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(listing.status) }}
                        >
                          {(listing.status ? listing.status.charAt(0).toUpperCase() + listing.status.slice(1) : 'Unknown')}
                        </span>
                      </div>
                      <div className="listing-performance-badge">
                        {(() => {
                          const occupancyRate = listing.totalRooms > 0
                            ? Math.round(((Number(listing.totalRooms || 0) - Number(listing.availableRooms || 0)) / Number(listing.totalRooms || 1)) * 100)
                            : 0;
                          return (
                            <span className={`performance-indicator ${occupancyRate >= 80 ? 'high' : occupancyRate >= 60 ? 'medium' : 'low'}`}>
                              {occupancyRate}% Full
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="listing-content">
                      <div className="listing-header">
                        <div className="header-main">
                          <h3>{listing.name}</h3>
                          <div className="listing-badges">
                            <div className="listing-type-badge">{listing.type}</div>
                            <div className="gender-badge">{listing.gender}</div>
                          </div>
                        </div>
                      </div>

                      <div className="listing-description">
                        <p>{listing.description || "Premium accommodation with excellent facilities and amenities."}</p>
                      </div>

                      <div className="listing-key-metrics">
                        <div className="metrics-grid">
                          <div className="metric-card">
                            <div className="metric-icon">🏠</div>
                            <div className="metric-info">
                              <span className="metric-value">{listing.availableRooms || 0}/{listing.totalRooms || 0}</span>
                              <span className="metric-label">Available Rooms</span>
                            </div>
                          </div>
                          <div className="metric-card">
                            <div className="metric-icon">💰</div>
                            <div className="metric-info">
                              <span className="metric-value">₹{(listing.startingPrice ?? listing.price ?? 0).toLocaleString()}</span>
                              <span className="metric-label">Starting From</span>
                            </div>
                          </div>
                          <div className="metric-card">
                            <div className="metric-icon">👥</div>
                            <div className="metric-info">
                              <span className="metric-value">{listing.occupancy || 'Single'}</span>
                              <span className="metric-label">Occupancy</span>
                            </div>
                          </div>
                          {listing.rating > 0 && (
                            <div className="metric-card">
                              <div className="metric-icon">⭐</div>
                              <div className="metric-info">
                                <span className="metric-value">{listing.rating}</span>
                                <span className="metric-label">{listing.reviews} Reviews</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rent-breakdown">
                        <h4>Room Types & Pricing</h4>
                        <div className="rent-grid">
                          {(() => {
                            const rd = listing.rentDetails;
                            if (!rd) return <span className="no-rates">No pricing information available</span>;
                            const rentItems = [];

                            if (rd.single?.rent > 0) {
                              rentItems.push(
                                <div key="single" className="rent-item">
                                  <div className="rent-type">
                                    <span className="room-icon">🛏️</span>
                                    <span className="room-type">Single Sharing</span>
                                  </div>
                                  <div className="rent-details">
                                    <span className="rent-price">₹{rd.single.rent.toLocaleString()}</span>
                                    <span className="rent-availability">
                                      {rd.single.available ? `${rd.single.count || 0} available` : 'Not available'}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            if (rd.double?.rent > 0) {
                              rentItems.push(
                                <div key="double" className="rent-item">
                                  <div className="rent-type">
                                    <span className="room-icon">🛏️ 🛏️</span>
                                    <span className="room-type">Double Sharing</span>
                                  </div>
                                  <div className="rent-details">
                                    <span className="rent-price">₹{rd.double.rent.toLocaleString()}</span>
                                    <span className="rent-availability">
                                      {rd.double.available ? `${rd.double.count || 0} available` : 'Not available'}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            if (rd.triple?.rent > 0) {
                              rentItems.push(
                                <div key="triple" className="rent-item">
                                  <div className="rent-type">
                                    <span className="room-icon">🛏️ 🛏️ 🛏️</span>
                                    <span className="room-type">Triple Sharing</span>
                                  </div>
                                  <div className="rent-details">
                                    <span className="rent-price">₹{rd.triple.rent.toLocaleString()}</span>
                                    <span className="rent-availability">
                                      {rd.triple.available ? `${rd.triple.count || 0} available` : 'Not available'}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            return rentItems.length > 0 ? rentItems : <span className="no-rates">No pricing information available</span>;
                          })()}
                        </div>
                      </div>

                      <div className="listing-stats">
                        <div className="stat">
                          <span className="stat-number">{listing.views || 0}</span>
                          <span className="stat-label">Views</span>
                        </div>
                        <div className="stat">
                          <span className="stat-number">{listing.inquiries || 0}</span>
                          <span className="stat-label">Inquiries</span>
                        </div>
                        <div className="stat">
                          <span className="stat-number">{listing.lastUpdated || 'Today'}</span>
                          <span className="stat-label">Updated</span>
                        </div>
                        
                      </div>

                      <div className="listing-amenities">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                          {(() => {
                            let amenitiesArr = [];
                            // Debug log
                            // console.log('My Listings amenities:', listing.amenities);
                            if (Array.isArray(listing.amenities)) {
                              // Handle case where it's an array with a single stringified array
                              if (listing.amenities.length === 1 && typeof listing.amenities[0] === 'string' && listing.amenities[0].startsWith('[')) {
                                try {
                                  const parsed = JSON.parse(listing.amenities[0]);
                                  if (Array.isArray(parsed)) amenitiesArr = parsed;
                                  else amenitiesArr = [listing.amenities[0]];
                                } catch {
                                  amenitiesArr = [listing.amenities[0]];
                                }
                              } else {
                                amenitiesArr = listing.amenities;
                              }
                            } else if (typeof listing.amenities === 'string') {
                              try {
                                const parsed = JSON.parse(listing.amenities);
                                if (Array.isArray(parsed)) amenitiesArr = parsed;
                                else amenitiesArr = [listing.amenities];
                              } catch {
                                if (listing.amenities.includes(',')) {
                                  amenitiesArr = listing.amenities.split(',').map(a => a.trim());
                                } else {
                                  amenitiesArr = [listing.amenities];
                                }
                              }
                            }
                            return amenitiesArr.length > 0
                              ? amenitiesArr.map((amenity, idx) => (
                                <span
                                  key={amenity + '-' + idx}
                                  style={{
                                    background: '#f0f4ff',
                                    color: '#2563eb',
                                    borderRadius: '16px',
                                    padding: '4px 12px',
                                    fontSize: '0.95em',
                                    fontWeight: 500,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                    border: '1px solid #e0e7ef',
                                    display: 'inline-block',
                                  }}
                                >
                                  {amenity}
                                </span>
                              ))
                              : <span style={{
                                background: '#f3f4f6',
                                color: '#6b7280',
                                borderRadius: '16px',
                                padding: '4px 12px',
                                fontSize: '0.95em',
                                fontWeight: 500,
                                border: '1px solid #e5e7eb',
                                display: 'inline-block',
                              }}>No amenities listed</span>;
                          })()}
                        </div>
                      </div>

                      <div className="listing-actions">
                        <button
                          className="action-btn view"
                          onClick={() => navigate(`/owner/hostel/${listing.id}`)}
                        >
                          👁️ View
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={() => navigate(`/owner/hostel/${listing.id}?edit=1`)}
                        >
                          ✏️ Edit
                        </button>
                        <div className="status-dropdown">
                          <select
                            value={listing.status}
                            onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="draft">Draft</option>
                          </select>
                        </div>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteListing(listing.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="listings-section">
            <h2 style={{ marginTop: 48 }}>Other Listings</h2>
            <div className="listings-grid">
              {otherListings.length === 0 ? (
                <div className="empty-state" key="empty-other-listings">
                  <div className="empty-icon">📋</div>
                  <h3>No other listings found</h3>
                </div>
              ) : (
                otherListings.map(listing => (
                  <div key={listing.id || listing._id || listing.title || Math.random()} className="owner-listing-card">
                    <div className="listing-image">
                      <img src={listing.image} alt={listing.name} />
                      <div className="listing-status">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(listing.status) }}
                        >
                          {listing.status ? listing.status.charAt(0).toUpperCase() + listing.status.slice(1) : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="listing-content">
                      <div className="listing-header">
                        <h3>{listing.title || listing.name || 'Untitled Listing'}</h3>
                        <div className="listing-type-badge">{listing.type}</div>
                      </div>

                      <div className="listing-details">
                        <p className="listing-description">{listing.description}</p>
                        <div className="detail-row">
                          <span>💰 ₹{!isNaN(listing.price) && listing.price !== undefined ? Number(listing.price).toLocaleString() : '0'}/month</span>
                          <span>👥 {listing.occupancy}</span>
                          <span>⚧ {listing.gender}</span>
                        </div>
                        <div className="detail-row">
                          <span>🏠 {(!isNaN(listing.occupiedRooms) && listing.occupiedRooms !== undefined ? listing.occupiedRooms : 0)}/{(!isNaN(listing.totalRooms) && listing.totalRooms !== undefined ? listing.totalRooms : 0)} occupied</span>
                          {listing.rating > 0 && (
                            <span>⭐ {(!isNaN(listing.rating) && listing.rating !== undefined ? listing.rating : 0)} ({(!isNaN(listing.reviews) && listing.reviews !== undefined ? listing.reviews : 0)} reviews)</span>
                          )}
                        </div>
                      </div>

                      <div className="listing-stats">
                        <div className="stat">
                          <span className="stat-number">{!isNaN(listing.views) && listing.views !== undefined ? listing.views : 0}</span>
                          <span className="stat-label">Views</span>
                        </div>
                        <div className="stat">
                          <span className="stat-number">{!isNaN(listing.inquiries) && listing.inquiries !== undefined ? listing.inquiries : 0}</span>
                          <span className="stat-label">Inquiries</span>
                        </div>
                        <div className="stat">
                          <span className="stat-number">{listing.lastUpdated ? listing.lastUpdated : ''}</span>
                          <span className="stat-label">Updated</span>
                        </div>
                      </div>

                      <div className="listing-amenities">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                          {(() => {
                            let amenitiesArr = [];
                            if (Array.isArray(listing.amenities)) {
                              amenitiesArr = listing.amenities;
                            } else if (typeof listing.amenities === 'string') {
                              try {
                                const parsed = JSON.parse(listing.amenities);
                                if (Array.isArray(parsed)) amenitiesArr = parsed;
                                else amenitiesArr = [listing.amenities];
                              } catch {
                                if (listing.amenities.includes(',')) {
                                  amenitiesArr = listing.amenities.split(',').map(a => a.trim());
                                } else {
                                  amenitiesArr = [listing.amenities];
                                }
                              }
                            }
                            return amenitiesArr.length > 0
                              ? amenitiesArr.map((amenity, idx) => (
                                <span key={amenity + '-' + idx} className="amenity-tag">{amenity}</span>
                              ))
                              : <span className="amenity-tag">No amenities listed</span>;
                          })()}
                        </div>
                      </div>

                      <div className="listing-actions">
                        <button
                          className="action-btn view"
                          onClick={() => navigate(`/hostel/${listing.id}`)}
                        >
                          👁️ View
                        </button>
                        {/* No edit/delete/status for other listings */}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {sortedListings.length > 0 && (
            <div className="bulk-actions">
              <div className="bulk-info">
                Showing {sortedListings.length} of {myListings.length} listings
              </div>
              <div className="bulk-buttons">
                <button className="secondary-btn">Export Data</button>
                <button className="secondary-btn">Bulk Edit</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
      />
    </div>
  );
};

export default OwnerListingManagement;