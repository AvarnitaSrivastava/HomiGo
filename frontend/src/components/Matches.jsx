import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import MatchCard from '../components/MatchCard';
import FilterPanel from '../components/FilterPanel';
import Toast from '../components/Toast';
import connectionService from '../services/connectionService';
import api from '../services/api';
import { RoommateCompatibilityMatcher } from '../services/roommateCompatibilityService';
import '../styles/matches.css';


const Matches = () => {
  const navigate = useNavigate();
  const [allMatches, setAllMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [connections, setConnections] = useState(new Set());
  const [requestIds, setRequestIds] = useState(new Map()); // Map userId to requestId
  const [pendingRequests, setPendingRequests] = useState([]); // Array of pending requests received
  const [toast, setToast] = useState({
    message: '',
    type: '',
    isVisible: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ageRange: [18, 52],
    budgetRange: [5000, 18000],
    gender: "",
    location: "",
    lifestyle: ""
  });
  
  
  // Temporary filters state that only applies when clicking Apply
  const [tempFilters, setTempFilters] = useState(filters);

  // Fetch connection data function (defined outside useEffect so it can be reused)
  const fetchConnectionData = async () => {
    try {
      // Fetch sent requests
      const sentRequestsResponse = await connectionService.getSentRequests();
      const sentRequestsData = sentRequestsResponse.data || sentRequestsResponse || [];
      const sentSet = new Set();
      const requestIdMap = new Map();
      
      if (Array.isArray(sentRequestsData)) {
        sentRequestsData.forEach(request => {
          if (request.status === 'pending') {
            // Handle both populated objects and plain IDs
            const receiverId = typeof request.receiver === 'object' && request.receiver !== null
              ? request.receiver._id 
              : request.receiver;
            sentSet.add(receiverId);
            requestIdMap.set(receiverId, request._id);
          }
        });
      }
      
      setSentRequests(sentSet);
      setRequestIds(requestIdMap);

      // Fetch pending requests (requests received from others)
      const pendingRequestsResponse = await connectionService.getPendingRequests();
      const pendingRequestsData = pendingRequestsResponse.data || pendingRequestsResponse || [];
      setPendingRequests(Array.isArray(pendingRequestsData) ? pendingRequestsData : []);

      // Fetch accepted connections
      const connectionsResponse = await connectionService.getConnections();
      const connectionsData = connectionsResponse.data || connectionsResponse || [];
      const connSet = new Set();
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = localStorage.getItem('userId') || currentUser._id || currentUser.id;
      
      if (Array.isArray(connectionsData)) {
        connectionsData.forEach((connection) => {
          // Backend returns: { connectionId, user: {...}, connectedAt }
          // We need the user._id
          if (connection.user) {
            const otherUserId = connection.user._id || connection.user.id;
            if (otherUserId) {
              connSet.add(String(otherUserId));
            }
          }
        });
      }
      
      setConnections(connSet);
    } catch (error) {
      console.error('Error fetching connection data:', error);
    }
  };



  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        // Get current user from local storage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (!currentUser?._id) {
          navigate('/login');
          return;
        }

        // Get all users from the users endpoint
        const response = await api.get('/users');
        
        if (!response.data?.success || !Array.isArray(response.data?.data)) {
          throw new Error('Invalid response format from server');
        }

        // Filter out current user and non-student users
        const otherUsers = response.data.data.filter(user => 
          user._id !== currentUser._id && (!user.role || user.role === 'student')
        );
        
        // Transform users data to include all required fields
        const matcher = new RoommateCompatibilityMatcher();
        const transformedMatches = otherUsers.map(user => {
          let compatibility = 0;
          try {
            // Force recompute compatibility score
            const score = matcher.calculateCompatibility(
              { 
                ...currentUser, 
                preferences: currentUser.preferences || {},
                lifestyle: currentUser.lifestyle || currentUser.preferences || {}
              },
              { 
                ...user,
                preferences: user.preferences || {},
                lifestyle: user.lifestyle || user.preferences || {}
              }
            );
            compatibility = score;
          } catch (error) {
            console.error('Error calculating compatibility:', error);
            compatibility = 50;
          }
          return {
            id: user._id,
            _id: user._id,
            name: user.fullname,
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            college: user.college,
            course: user.course,
            year: user.year,
            location: user.location,
            profileImage: user.profilePicture || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
            profilePicture: user.profilePicture,
            budget: user.budget?.max || user.budget?.min || 0,
            budgetRange: user.budget,
            preferences: user.preferences,
            interests: user.interests || [],
            compatibility: compatibility,
            verified: true,
            isPerfectMatch: compatibility >= 90,
            requestSent: false,
            connected: false
          };
        });
        
        // Sort matches by compatibility
        const sortedMatches = transformedMatches.sort((a, b) => b.compatibility - a.compatibility);
        
        setAllMatches(sortedMatches);
        setFilteredMatches(sortedMatches);
        
        // After fetching matches, fetch connection data
        await fetchConnectionData();
      } catch (error) {
        let errorMessage;
        
        if (!navigator.onLine) {
          errorMessage = 'No internet connection. Please check your network.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Please log in to continue';
          localStorage.removeItem('token');
          navigate('/login');
        } else if (error.response?.status === 404) {
          errorMessage = 'Could not connect to server. Please try again.';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = error.message || 'Unable to load matches. Please try again.';
        }
        
        setToast({ 
          message: errorMessage, 
          type: 'error', 
          isVisible: true 
        });
        
        setAllMatches([]);
        setFilteredMatches([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [navigate]);

  // Handle scroll lock and filter panel state
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'auto';
      // Reset temporary filters to current filters when opening panel
      setTempFilters(filters);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showFilters, filters]);

  useEffect(() => {
    let filtered = allMatches.filter(match => {
      // Remove age filter since users don't have age field
      const budgetMatch = match.budget >= filters.budgetRange[0] && match.budget <= filters.budgetRange[1];
      const genderMatch = !filters.gender || match.gender === filters.gender;
      const locationMatch = !filters.location || match.location.toLowerCase().includes(filters.location.toLowerCase());
      // Remove lifestyle filter for now since it's not in user data structure
      
      return budgetMatch && genderMatch && locationMatch;
    });

    setFilteredMatches(filtered);
  }, [filters, allMatches]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleFilterChange = (newFilters) => {
    setTempFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };

  const handleRequest = async (matchId, matchName) => {
    try {
      await connectionService.sendRequest(matchId);
      
      // Add to sent requests
      setSentRequests(prev => new Set([...prev, matchId]));
      
      // Update UI
      setFilteredMatches(prevMatches =>
        prevMatches.map(match =>
          match.id === matchId
            ? { ...match, requestSent: true }
            : match
        )
      );
      setAllMatches(prevMatches =>
        prevMatches.map(match =>
          match.id === matchId
            ? { ...match, requestSent: true }
            : match
        )
      );

      showToast(`🎉 Roommate request sent to ${matchName}! They will be notified.`, 'success');
    } catch (error) {
  // Handle request error without logging detailed error to console
      
      // Extract error message from response
      let errorMessage = 'Failed to send request. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show specific error for already connected users
      if (errorMessage.toLowerCase().includes('already connected')) {
        showToast(`You're already connected with ${matchName}!`, 'info');
        // Refresh connection data to update UI
        await fetchConnectionData();
      } else if (errorMessage.toLowerCase().includes('pending')) {
        showToast(`You already have a pending request with ${matchName}.`, 'info');
        await fetchConnectionData();
      } else {
        showToast(errorMessage, 'error');
      }
    }
  };

  const handleCancelRequest = async (matchId, matchName) => {
    try {
      const requestId = requestIds.get(matchId);
      if (requestId) {
        await connectionService.cancelRequest(requestId);
        
        // Remove from sent requests
        setSentRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(matchId);
          return newSet;
        });
        
        // Remove from request IDs map
        setRequestIds(prev => {
          const newMap = new Map(prev);
          newMap.delete(matchId);
          return newMap;
        });
        
        // Update UI - check both id and _id
        setFilteredMatches(prevMatches =>
          prevMatches.map(match => {
            const id = match._id || match.id;
            return id === matchId
              ? { ...match, requestSent: false }
              : match;
          })
        );
        setAllMatches(prevMatches =>
          prevMatches.map(match => {
            const id = match._id || match.id;
            return id === matchId
              ? { ...match, requestSent: false }
              : match;
          })
        );

        showToast(`Request to ${matchName} has been cancelled.`, 'info');
      } else {
        showToast(`Could not find request to cancel.`, 'error');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      showToast(`Failed to cancel request. Please try again.`, 'error');
    }
  };

  const handleMessage = (matchId, matchName) => {
    showToast(`Opening conversation with ${matchName}...`, 'info');
    // TODO: Navigate to messages page or open message modal
  };

  const handleReject = (matchId, matchName) => {

    setFilteredMatches(prevMatches =>
      prevMatches.filter(match => match.id !== matchId)
    );

    showToast(`${matchName} has been removed from your matches.`, 'info');
  };

  const handleAcceptRequest = async (requestId, senderName, senderId) => {
    try {
      await connectionService.acceptRequest(requestId);
      
      // Remove from pending requests
      const acceptedRequest = pendingRequests.find(req => req._id === requestId);
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      
      // Refresh connection data to update connections set
      await fetchConnectionData();
      
      showToast(`🎉 You're now connected with ${senderName}! Redirecting to messages...`, 'success');
      
      // Wait a moment then redirect to messages page with user data
      setTimeout(() => {
        if (acceptedRequest && acceptedRequest.sender) {
          const sender = acceptedRequest.sender;
          navigate('/messages', { 
            state: { 
              userId: sender._id,
              otherUser: {
                _id: sender._id,
                fullname: sender.fullname,
                username: sender.username,
                profilePicture: sender.profilePicture,
                email: sender.email,
                location: sender.location,
                course: sender.course
              }
            } 
          });
        } else {
          navigate('/messages');
        }
      }, 1500);
    } catch (error) {
      console.error('Error accepting request:', error);
      showToast(`Failed to accept request. Please try again.`, 'error');
    }
  };

  const handleRejectRequest = async (requestId, senderName) => {
    try {
      await connectionService.rejectRequest(requestId);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      
      showToast(`Request from ${senderName} has been declined.`, 'info');
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast(`Failed to reject request. Please try again.`, 'error');
    }
  };

  const perfectMatches = filteredMatches.filter(match => match.isPerfectMatch && !match.requestSent);

  if (loading) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <div className="main-content">
          <div className="dashboard-contain">
            <header className="dashboard-header">
              <div className="header-content">
                <h1>Find Your Perfect Roommate</h1>
                <p className="matches-subtitle">Discovering compatible roommates...</p>
              </div>
            </header>
            <div className="matches-content">
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Finding your perfect roommates...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="main-content">
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />

        <div className="dashboard-contain">
          {/* Navigation Header */}
          <header className="dashboard-header">
            <div className="header-content">
              <h1>Find Your Perfect Roommate</h1>
              <p className="matches-subtitle">Discover compatible roommates based on your preferences</p>
            </div>
          </header>

          <div className="matches-content">
            <div className="sidebar-filters">

            </div>

            <div className="matches-main">
              <div className="section-header">
                <h2>All Matches</h2>
                <span className="arrow">→</span>
              </div>

              <div className="matches-header">
                <div className="matches-count">
                  {filteredMatches.filter(match => !match.requestSent).length} potential roommates found
                </div>
                <button 
                  className="advanced-filter-btn"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide Filters' : 'Advanced Filters'} 🔍
                </button>
              </div>

              {showFilters && (
                <div className="overlay" onClick={() => setShowFilters(false)}>
                  <div className="filter-panel-container" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="close-filter-btn"
                      onClick={() => setShowFilters(false)}
                    >
                      ✕
                    </button>
                    <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Advanced Filters</h2>
                    <FilterPanel 
                      filters={tempFilters} 
                      onFilterChange={handleFilterChange}
                      onApply={handleApplyFilters}
                    />
                  </div>
                </div>
              )}

              {/* Connected Users Section - PRIORITY 1 (Most Important) */}
              {allMatches.filter(match => connections.has(match._id || match.id)).length > 0 && (
                <>
                  <div className="section-header priority-section">
                    <h2>💬 Your Connections</h2>
                    <span className="badge-count success">{allMatches.filter(match => connections.has(match._id || match.id)).length}</span>
                  </div>
                  <div className="connected-users-grid">
                    {allMatches.filter(match => connections.has(match._id || match.id)).map(match => (
                      <div key={match._id || match.id} className="connected-user-card">
                        <div className="connected-user-profile">
                          <img 
                            src={match.profileImage} 
                            alt={`${match.name}'s profile`}
                            className="connected-user-avatar"
                            onError={(e) => {
                              e.target.src = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1';
                            }}
                          />
                          <div className="connected-user-info">
                            <h4 className="connected-user-name">{match.name}</h4>
                            <p className="connected-user-details">
                              📍 {match.location} • 🎓 {match.course}
                            </p>
                            <div className="connected-user-status">
                              <span className="status-indicator connected">✅ Connected</span>
                              <span className="compatibility-small">{match.compatibility}% match</span>
                            </div>
                          </div>
                        </div>
                        <div className="connected-user-actions">
                          <button 
                            className="message-connected-btn"
                            onClick={() => navigate('/messages', { 
                              state: { 
                                userId: match._id || match.id,
                                otherUser: {
                                  _id: match._id || match.id,
                                  fullname: match.name,
                                  username: match.username || match.name.toLowerCase().replace(/\s+/g, ''),
                                  profilePicture: match.profileImage,
                                  email: match.email,
                                  location: match.location,
                                  course: match.course
                                }
                              } 
                            })}
                          >
                            💬 Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pending Requests Section - PRIORITY 2 (Requests you received) */}
              {pendingRequests.length > 0 && (
                <>
                  <div className="section-header">
                    <h2>🔔 Pending Requests</h2>
                    <span className="badge-count">{pendingRequests.length}</span>
                  </div>
                  <div className="pending-requests-grid">
                    {pendingRequests.map(request => {
                      const sender = request.sender;
                      return (
                        <div key={request._id} className="pending-request-card">
                          <div className="pending-request-profile">
                            <img 
                              src={sender.profilePicture || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'} 
                              alt={`${sender.fullname}'s profile`}
                              className="pending-request-avatar"
                              onError={(e) => {
                                e.target.src = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1';
                              }}
                            />
                            <div className="pending-request-info">
                              <h4 className="pending-request-name">{sender.fullname}</h4>
                              <p className="pending-request-details">
                                📍 {sender.location || 'Location not specified'} • 🎓 {sender.course || 'Course not specified'}
                              </p>
                              {request.message && (
                                <p className="request-message">💬 "{request.message}"</p>
                              )}
                            </div>
                          </div>
                          <div className="pending-request-actions">
                            <button 
                              className="accept-request-btn"
                              onClick={() => handleAcceptRequest(request._id, sender.fullname, sender._id)}
                            >
                              ✓ Accept
                            </button>
                            <button 
                              className="decline-request-btn"
                              onClick={() => handleRejectRequest(request._id, sender.fullname)}
                            >
                              ✕ Decline
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Sent Requests Section */}
              {allMatches.filter(match => sentRequests.has(match._id || match.id)).length > 0 && (
                <>
                  <div className="section-header">
                    <h2>Sent Requests</h2>
                    <span className="arrow">→</span>
                  </div>
                  <div className="sent-requests-grid">
                    {allMatches.filter(match => sentRequests.has(match._id || match.id)).map(match => (
                      <div key={match._id || match.id} className="sent-request-card">
                        <div className="sent-request-profile">
                          <img 
                            src={match.profileImage} 
                            alt={`${match.name}'s profile`}
                            className="sent-request-avatar"
                            onError={(e) => {
                              e.target.src = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1';
                            }}
                          />
                          <div className="sent-request-info">
                            <h4 className="sent-request-name">{match.name}</h4>
                            <p className="sent-request-details">
                              📍 {match.location} • 🎓 {match.course}
                            </p>
                            <div className="sent-request-status">
                              <span className="status-indicator">✅ Request Sent</span>
                              <span className="compatibility-small">{match.compatibility}% match</span>
                            </div>
                          </div>
                        </div>
                        <div className="sent-request-actions">
                          <button 
                            className="cancel-sent-btn"
                            onClick={() => handleCancelRequest(match._id || match.id, match.name)}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="matches-grid">
                {filteredMatches.filter(match => !sentRequests.has(match._id || match.id)).map(match => {
                  const matchId = String(match._id || match.id);
                  const isConnected = connections.has(matchId);
                  
                  return (
                    <MatchCard
                      key={matchId}
                      match={{
                        ...match,
                        requestSent: sentRequests.has(match._id || match.id),
                        connected: isConnected
                      }}
                      onRequest={handleRequest}
                      onReject={handleReject}
                      onCancelRequest={handleCancelRequest}
                    />
                  );
                })}
              </div>

              {filteredMatches.length === 0 && (
                <div className="no-matches">
                  <h3>No matches found</h3>
                  <p>Try adjusting your filters to see more potential roommates.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer/>
      </div>
    </div>
  );
};

export default Matches;