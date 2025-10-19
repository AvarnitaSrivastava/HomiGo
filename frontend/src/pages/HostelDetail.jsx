import React, { useState, useEffect } from 'react';
// Determine user role from localStorage
const user = JSON.parse(localStorage.getItem('user') || '{}');
const isOwner = user.role === 'owner';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import roomService from '../services/roomService';
import './HostelDetail.css';

const HostelDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState({
    message: '',
    type: '',
    isVisible: false
  });
  const [matchesFilter, setMatchesFilter] = useState('all'); // all, in-hostel, looking-for, nearby
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    setLoading(true);
    roomService.getRoomDetails(id)
      .then(response => {
        if (response.success) {
          setHostel(response.data);
          // Seed edit form with current listing data
          const d = response.data || {};
          setEditData({
            title: d.name || '',
            description: d.description || '',
            address: d.address || d.location || '',
            price: d.price || 0,
            availableRooms: d.availableRooms || 0,
            roomType: d.occupancy?.toLowerCase().includes('2') ? 'shared' : (d.occupancy?.toLowerCase().includes('1') ? 'single' : 'shared'),
            amenities: Array.isArray(d.amenities) ? d.amenities : [],
            preferences: {
              gender: (d.gender || 'any').toLowerCase(),
              foodPreferences: 'any'
            },
            rents: d.rents || { single: 0, double: 0, triple: 0 },
            houseRules: d.houseRules || '',
            whatsNearby: d.whatsNearby || '',
            propertyType: d.propertyType || '',
            totalRooms: d.totalRooms || 0,
            yearBuilt: d.yearBuilt || '',
            furnished: !!d.furnished,
            ownerName: d.ownerName || '',
            ownerPhone: d.ownerPhone || '',
            ownerEmail: d.ownerEmail || ''
          });
          // If coming from owner listings with ?edit=1 and user is owner, open editor
          try {
            const shouldEdit = searchParams.get('edit') === '1';
            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (shouldEdit && localUser?.role === 'owner') {
              // We'll open editor after state seeded later in the file
              // but set a small timeout to allow editData to be prepared
              setTimeout(() => setIsEditing(true), 0);
            }
          } catch { }
        } else {
          setHostel(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setHostel(null);
        setLoading(false);
      });

    // Fetch potential matches for this hostel only if not owner
    if (!isOwner) {
      import('../services/matchService').then(({ default: matchService }) => {
        matchService.getMatches()
          .then(matches => {
            // Optionally filter matches by hostel id if needed
            const filtered = matches.filter(m => m.hostelId === id || m.matchType === 'in-hostel');
            setPotentialMatches(filtered);
          })
          .catch(() => setPotentialMatches([]));
      });
    }
  }, [id]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  // Simple input handlers for owner edit
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => {
      if (!prev) return prev;
      if (name.startsWith('preferences.')) {
        const k = name.split('.')[1];
        return { ...prev, preferences: { ...prev.preferences, [k]: value } };
      }
      if (name.startsWith('rents.')) {
        const k = name.split('.')[1];
        return { ...prev, rents: { ...prev.rents, [k]: value } };
      }
      if (name === 'furnished') {
        return { ...prev, furnished: type === 'checkbox' ? checked : value };
      }
      return { ...prev, [name]: type === 'number' ? Number(value) : value };
    });
  };

  const parseAmenitiesInput = (val) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    return String(val).split(',').map(a => a.trim()).filter(Boolean);
  };

  const handleSaveEdits = async () => {
    try {
      const payload = {
        title: editData.title,
        description: editData.description,
        address: editData.address,
        price: Number(editData.price) || 0,
        availableRooms: Number(editData.availableRooms) || 0,
        roomType: editData.roomType,
        amenities: parseAmenitiesInput(editData.amenities),
        preferences: editData.preferences,
        rents: {
          single: Number(editData.rents?.single) || 0,
          double: Number(editData.rents?.double) || 0,
          triple: Number(editData.rents?.triple) || 0
        },
        houseRules: editData.houseRules || '',
        whatsNearby: editData.whatsNearby || '',
        propertyType: editData.propertyType || '',
        totalRooms: Number(editData.totalRooms) || 0,
        yearBuilt: editData.yearBuilt || '',
        furnished: !!editData.furnished,
        ownerName: editData.ownerName || '',
        ownerPhone: editData.ownerPhone || '',
        ownerEmail: editData.ownerEmail || ''
      };

      const resp = await roomService.updateRoom(id, payload);
      if (resp.success) {
        const fresh = await roomService.getRoomDetails(id);
        if (fresh.success) {
          setHostel(fresh.data);
          setIsEditing(false);
          showToast('Listing updated successfully', 'success');
        } else {
          showToast('Updated but failed to refresh details', 'error');
        }
      } else {
        showToast(resp.message || 'Failed to update listing', 'error');
      }
    } catch (err) {
      console.error('Update error:', err);
      showToast(err?.message || 'Failed to update listing', 'error');
    }
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleSaveHostel = () => {
    setIsSaved(!isSaved);
    showToast(isSaved ? 'Removed from saved hostels' : 'Hostel saved successfully!', 'success');
  };

  const handleContactOwner = () => {
    setShowContactForm(true);
  };

  const handleSendMessage = (matchId, matchName) => {
    showToast(`Message sent to ${matchName}!`, 'success');
  };

  const handleSendRequest = (matchId, matchName) => {
    setPotentialMatches(prev =>
      prev.map(match =>
        match.id === matchId
          ? { ...match, requestSent: true }
          : match
      )
    );
    showToast(`Roommate request sent to ${matchName}!`, 'success');
  };

  const getCompatibilityColor = (score) => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 80) return '#F59E0B'; // Yellow
    if (score >= 70) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const getMatchTypeText = (type) => {
    switch (type) {
      case 'in-hostel': return 'Currently living here';
      case 'looking-for': return 'Looking for this hostel';
      case 'nearby': return 'Lives nearby';
      default: return '';
    }
  };

  const getMatchTypeIcon = (type) => {
    switch (type) {
      case 'in-hostel': return '🏠';
      case 'looking-for': return '🔍';
      case 'nearby': return '📍';
      default: return '';
    }
  };

  const filteredMatches = potentialMatches.filter(match => {
    if (matchesFilter === 'all') return true;
    return match.matchType === matchesFilter;
  });

  if (loading) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <div className="main-content">
          <div className="hostel-detail-loading">
            <div className="loading-spinner"></div>
            <p>Loading hostel details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <div className="main-content">
          <div className="hostel-detail-error">
            <h2>Hostel not found</h2>
            <p>The hostel you're looking for doesn't exist.</p>
            <button onClick={() => navigate('/hostels')} className="btn-primary">
              Back to Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compute safe owner fields and derived UI helpers
  const ownerName = typeof hostel.owner === 'string'
    ? hostel.owner
    : (hostel.owner?.fullname || hostel.owner?.name || 'Owner');
  const ownerInitial = (ownerName || 'O').charAt(0).toUpperCase();
  // Prefer detailed rent info when available; otherwise build from numeric rents
  const rd = (hostel.rentDetails || hostel.rents)
    ? (hostel.rentDetails || {
        single: { rent: Number(hostel.rents?.single) || 0, available: false, count: 0 },
        double: { rent: Number(hostel.rents?.double) || 0, available: false, count: 0 },
        triple: { rent: Number(hostel.rents?.triple) || 0, available: false, count: 0 }
      })
    : { single: { rent: 0, available: false, count: 0 }, double: { rent: 0, available: false, count: 0 }, triple: { rent: 0, available: false, count: 0 } };
  const hasAnyRent = !!(Number(rd.single?.rent) || Number(rd.double?.rent) || Number(rd.triple?.rent));
  // Backwards-compatible rules and nearby parsing
  const rulesArray = Array.isArray(hostel.rules) && hostel.rules.length > 0
    ? hostel.rules
    : ((hostel.houseRules || '')
      .split(/\n|\.|,|;/)
      .map(r => r.trim())
      .filter(Boolean));
  const nearbyChips = Array.isArray(hostel.nearbyPlaces) && hostel.nearbyPlaces.length > 0
    ? hostel.nearbyPlaces.map(p => (p?.name ? p.name : typeof p === 'string' ? p : '')).filter(Boolean)
    : ((hostel.whatsNearby || '')
      .split(/\n|,|;/)
      .map(p => p.trim())
      .filter(Boolean));

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

          <div className="hostel-detail-container">
            {/* Back Button */}
            <div className="hostel-detail-header">
              <button onClick={() => navigate('/hostels')} className="back-btn">
                ← Back to Listings
              </button>
              <div className="hostel-detail-actions">
                <button
                  onClick={handleSaveHostel}
                  className={`save-hostel-btn ${isSaved ? 'saved' : ''}`}
                >
                  <span className="icon">{isSaved ? '❤️' : '🤍'}</span>
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                {(() => {
                  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                  const isListingOwner = (userObj?.role === 'owner') && (userObj?._id === hostel.ownerId || userObj?.id === hostel.ownerId);
                  return isListingOwner ? (
                    <button
                      onClick={() => setIsEditing(v => !v)}
                      className="save-hostel-btn"
                      style={{ background: isEditing ? '#fef3c7' : '#e5e7eb', color: '#111827' }}
                    >
                      ✏️ {isEditing ? 'Close Editor' : 'Edit Listing'}
                    </button>
                  ) : null;
                })()}
              </div>
            </div>

            {isEditing && editData && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, margin: '0 12px 16px 12px', background: '#fff' }}>
                <h3 style={{ marginTop: 0 }}>Edit Listing</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <label>Title</label>
                    <input name="title" value={editData.title} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Address</label>
                    <input name="address" value={editData.address} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Price (₹)</label>
                    <input type="number" name="price" value={editData.price} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Available Rooms</label>
                    <input type="number" name="availableRooms" value={editData.availableRooms} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Room Type</label>
                    <select name="roomType" value={editData.roomType} onChange={handleEditChange}>
                      <option value="single">Single</option>
                      <option value="shared">Shared</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea name="description" rows={3} value={editData.description} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Single Rent</label>
                    <input type="number" name="rents.single" value={editData.rents?.single || 0} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Double Rent</label>
                    <input type="number" name="rents.double" value={editData.rents?.double || 0} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Triple Rent</label>
                    <input type="number" name="rents.triple" value={editData.rents?.triple || 0} onChange={handleEditChange} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Amenities (comma-separated)</label>
                    <input name="amenities" value={Array.isArray(editData.amenities) ? editData.amenities.join(', ') : (editData.amenities || '')} onChange={handleEditChange} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>House Rules</label>
                    <textarea name="houseRules" rows={3} value={editData.houseRules} onChange={handleEditChange} placeholder="Separate with new lines or commas" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>What's Nearby</label>
                    <textarea name="whatsNearby" rows={2} value={editData.whatsNearby} onChange={handleEditChange} placeholder="Separate with new lines or commas" />
                  </div>
                  <div>
                    <label>Property Type</label>
                    <input name="propertyType" value={editData.propertyType} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Total Rooms</label>
                    <input type="number" name="totalRooms" value={editData.totalRooms} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Year Built</label>
                    <input name="yearBuilt" value={editData.yearBuilt} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>
                      <input type="checkbox" name="furnished" checked={!!editData.furnished} onChange={handleEditChange} /> Furnished
                    </label>
                  </div>
                  <div>
                    <label>Owner Name</label>
                    <input name="ownerName" value={editData.ownerName} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Owner Phone</label>
                    <input name="ownerPhone" value={editData.ownerPhone} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label>Owner Email</label>
                    <input name="ownerEmail" value={editData.ownerEmail} onChange={handleEditChange} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn-primary" onClick={handleSaveEdits}>Save Changes</button>
                  <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Hero Banner with overlay */}
            <div className="hero-banner">
              <div className="hero-media">
                <img
                  src={
                    (hostel.images && hostel.images[activeImageIndex])
                      || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80'
                  }
                  alt={hostel.name || 'Hostel'}
                  onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80'; }}
                />
                <div className="hero-overlay">
                  <div className="hero-top">
                    <div className="hero-breadcrumb">🏠 Hostel • Student Housing</div>
                  </div>
                  <div className="hero-main">
                    <h1 className="hero-title">{hostel.name} {hostel.verified && <span className="verified-badge">✓ Verified</span>}</h1>
                    <div className="hero-sub">
                      <span>📍 {hostel.location || hostel.address}</span>
                      {hostel.distance != null && <span className="hd-dot">•</span>}
                      {hostel.distance != null && <span>{Number(hostel.distance).toFixed(2)}km away</span>}
                      <span className="hd-dot">•</span>
                      <span>⭐ {hostel.rating} ({hostel.reviews} reviews)</span>
                    </div>
                  </div>
                  <div className="hero-actions">
                    <button
                      onClick={handleSaveHostel}
                      className={`hero-save ${isSaved ? 'saved' : ''}`}
                    >
                      {isSaved ? '♥ Saved' : '♡ Save'}
                    </button>
                    <button className="hero-contact" onClick={handleContactOwner}>📞 Contact Owner</button>
                  </div>
                </div>
              </div>
              {hostel.images && hostel.images.length > 1 && (
                <div className="hero-thumbs">
                  {hostel.images.slice(0, 6).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`thumb-${idx + 1}`}
                      className={`hero-thumb ${activeImageIndex === idx ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}
                      onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=300&q=60'; }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Potential Matches Section (only for students) */}
            {!isOwner && (
              <div className="potential-matches-section">
                {/* ...existing code for matches... */}
              </div>
            )}

            {/* Hostel Information */}
            <div className="hostel-contentt">
              <div className="hostel-main-info">
                {/* Unique header layout */}
                <div className="hd-header">
                  <div className="hd-header-left">
                    <div className="hd-image-thumb">
                      <img
                        src={(hostel.images && hostel.images[0]) || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&q=80'}
                        alt={hostel.name || 'Hostel'}
                        onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&q=80'; }}
                      />
                    </div>
                    <div>
                      <div className="hd-title-row">
                        <h1 className="hd-title">{hostel.name}</h1>
                        {hostel.verified && <span className="verified-badge">✓ Verified</span>}
                      </div>
                      <div className="hd-subrow">
                        <span>📍 {hostel.location || hostel.address}</span>
                        {hostel.distance != null && <span className="hd-dot">•</span>}
                        {hostel.distance != null && <span>{Number(hostel.distance).toFixed(2)}km away</span>}
                      </div>
                    </div>
                  </div>
                  <div className="hd-header-right">
                    <div className="hd-rating">
                      <span className="hd-stars">⭐ {hostel.rating}</span>
                      <span className="hd-reviews">({hostel.reviews} reviews)</span>
                    </div>
                    <div className="hd-updated">Updated {hostel.lastUpdated}</div>
                  </div>
                </div>

                <div className="hd-summary-card">
                  <div className="price-section">
                    <div className="price">₹{(hostel.startingPrice ?? hostel.price ?? 0).toLocaleString()}</div>
                    <div className="price-label">per month</div>
                  </div>
                  <div className="availability-section">
                    <div className={`availability-status ${hostel.available ? 'available' : 'unavailable'}`}>
                      {hostel.available ? '✓ Available' : '✗ Fully Occupied'}
                    </div>
                    {(hostel.totalRooms > 0) && (
                      <div className="rooms-available">
                        {Number(hostel.availableRooms || 0)} of {Number(hostel.totalRooms || 0)} rooms available
                      </div>
                    )}
                  </div>
                </div>

                {/* Room Rents */}
                <div className="hostel-rents" style={{ marginTop: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Room Rents</h3>
                  {hasAnyRent ? (
                    <div className="rent-grid">
                      {Number(rd.single?.rent) > 0 && (
                        <div className={`rent-card ${rd.single?.available ? 'available' : ''}`}>
                          <div className="rent-card-head">
                            <span className="rent-type">Single</span>
                            {rd.single?.available ? <span className="pill pill-green">Available</span> : <span className="pill">Not Available</span>}
                          </div>
                          <div className="rent-price">₹{Number(rd.single?.rent).toLocaleString()}</div>
                          {(rd.single?.count ?? 0) > 0 && <div className="rent-count">{rd.single.count} rooms</div>}
                        </div>
                      )}
                      {Number(rd.double?.rent) > 0 && (
                        <div className={`rent-card ${rd.double?.available ? 'available' : ''}`}>
                          <div className="rent-card-head">
                            <span className="rent-type">Double</span>
                            {rd.double?.available ? <span className="pill pill-blue">Available</span> : <span className="pill">Not Available</span>}
                          </div>
                          <div className="rent-price">₹{Number(rd.double?.rent).toLocaleString()}</div>
                          {(rd.double?.count ?? 0) > 0 && <div className="rent-count">{rd.double.count} rooms</div>}
                        </div>
                      )}
                      {Number(rd.triple?.rent) > 0 && (
                        <div className={`rent-card ${rd.triple?.available ? 'available' : ''}`}>
                          <div className="rent-card-head">
                            <span className="rent-type">Triple</span>
                            {rd.triple?.available ? <span className="pill pill-orange">Available</span> : <span className="pill">Not Available</span>}
                          </div>
                          <div className="rent-price">₹{Number(rd.triple?.rent).toLocaleString()}</div>
                          {(rd.triple?.count ?? 0) > 0 && <div className="rent-count">{rd.triple.count} rooms</div>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#6b7280', fontSize: 14 }}>Not specified</div>
                  )}
                </div>

                <div className="hostel-quick-info">
                  <div className="quick-info-item">
                    <span className="icon">👥</span>
                    <span className="value">{hostel.occupancy}</span>
                  </div>
                  <div className="quick-info-item">
                    <span className="icon">🚻</span>
                    <span className="value">{hostel.gender}</span>
                  </div>
                  <div className="quick-info-item">
                    <span className="icon">📍</span>
                    <span className="value">{hostel.address}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="hostel-description">
                  <h3>About this place</h3>
                  <p>{hostel.description || 'Description not provided.'}</p>
                </div>

                {/* Amenities */}
                <div className="hostel-amenities">
                  <h3>Amenities</h3>
                  <div className="amenities-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                    {(() => {
                      let amenitiesArr = [];
                      if (Array.isArray(hostel.amenities)) {
                        if (hostel.amenities.length === 1 && typeof hostel.amenities[0] === 'string' && hostel.amenities[0].startsWith('[')) {
                          try {
                            const parsed = JSON.parse(hostel.amenities[0]);
                            if (Array.isArray(parsed)) amenitiesArr = parsed;
                            else amenitiesArr = [hostel.amenities[0]];
                          } catch {
                            amenitiesArr = [hostel.amenities[0]];
                          }
                        } else {
                          amenitiesArr = hostel.amenities;
                        }
                      } else if (typeof hostel.amenities === 'string') {
                        try {
                          const parsed = JSON.parse(hostel.amenities);
                          if (Array.isArray(parsed)) amenitiesArr = parsed;
                          else amenitiesArr = [hostel.amenities];
                        } catch {
                          if (hostel.amenities.includes(',')) {
                            amenitiesArr = hostel.amenities.split(',').map(a => a.trim());
                          } else {
                            amenitiesArr = [hostel.amenities];
                          }
                        }
                      }
                      return amenitiesArr.length > 0
                        ? amenitiesArr.map((amenity, index) => (
                          <span key={amenity + '-' + index} className="amenity-tag" style={{ padding: '6px 12px', background: '#f0f4ff', borderRadius: '20px', fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="amenity-icon">
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
                        ))
                        : <span style={{ color: '#6b7280' }}>No amenities listed</span>;
                    })()}
                  </div>
                </div>

                {/* Rules */}
                <div className="hostel-rules">
                  <h3>House Rules</h3>
                  {rulesArray.length > 0 ? (
                    <ul className="rules-list">
                      {rulesArray.map((rule, index) => (
                        <li key={index} className="rule-item">
                          <span className="rule-icon">•</span>
                          <span className="rule-text">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: '#6b7280' }}>No specific rules provided.</div>
                  )}
                </div>

                {/* What's Nearby */}
                <div className="hostel-nearby">
                  <h3>What's nearby</h3>
                  {nearbyChips.length > 0 ? (
                    <div className="nearby-places" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {nearbyChips.map((place, index) => (
                        <span key={index} className="amenity-tag" style={{ padding: '6px 12px', background: '#eef2ff', borderRadius: 20, fontSize: 12, color: '#4f46e5' }}>{place}</span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#6b7280' }}>No nearby landmarks provided.</div>
                  )}
                </div>

                {/* Property Details */}
                <div className="hostel-property-details" style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Property Details</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ color: '#374151' }}><strong>Type:</strong> {hostel.propertyType || '—'}</div>
                    <div style={{ color: '#374151' }}><strong>Furnished:</strong> {hostel.furnished ? 'Yes' : 'No'}</div>
                    <div style={{ color: '#374151' }}><strong>Year Built:</strong> {hostel.yearBuilt || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Owner Information Sidebar */}
              <div className="hostel-sidebar sticky">
                <div className="owner-card">
                  <h3>Contact Owner</h3>
                  <div className="owner-info">
                    <div className="owner-header">
                      <div className="owner-avatar">
                        {ownerInitial}
                      </div>
                      <div className="owner-details">
                        <div className="owner-name">
                          {ownerName}
                        </div>
                        <div className="owner-meta">
                          {hostel.ownerPhone && <div className="response-time">📞 {hostel.ownerPhone}</div>}
                          {hostel.ownerEmail && <div className="joined-date">✉️ {hostel.ownerEmail}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="contact-actions">
                      <button className="btn-primary contact-btn" onClick={handleContactOwner}>
                        <span className="icon">📞</span>
                        Contact Owner
                      </button>
                      <button className="btn-secondary message-btn">
                        <span className="icon">💬</span>
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="hostel-stats">
                  <h4>Quick Stats</h4>
                  <div className="stat-item">
                    <span className="stat-label">Total Rooms:</span>
                    <span className="stat-value">{hostel.totalRooms}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Available:</span>
                    <span className="stat-value">{hostel.availableRooms}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Rating:</span>
                    <span className="stat-value">⭐ {hostel.rating}/5</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Reviews:</span>
                    <span className="stat-value">{hostel.reviews}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Potential Matches Section */}
            <div className="potential-matches-section">
              <div className="matches-header">
                <h2>Potential Roommates</h2>
                <p className="matches-subtitle">
                  Compatible people who are in this hostel, looking for it, or nearby
                </p>
              </div>

              {/* Matches Filter */}
              <div className="matches-filter">
                <button
                  className={`filter-btn ${matchesFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setMatchesFilter('all')}
                >
                  All ({potentialMatches.length})
                </button>
                <button
                  className={`filter-btn ${matchesFilter === 'in-hostel' ? 'active' : ''}`}
                  onClick={() => setMatchesFilter('in-hostel')}
                >
                  🏠 Living Here ({potentialMatches.filter(m => m.matchType === 'in-hostel').length})
                </button>
                <button
                  className={`filter-btn ${matchesFilter === 'looking-for' ? 'active' : ''}`}
                  onClick={() => setMatchesFilter('looking-for')}
                >
                  🔍 Looking For ({potentialMatches.filter(m => m.matchType === 'looking-for').length})
                </button>
                <button
                  className={`filter-btn ${matchesFilter === 'nearby' ? 'active' : ''}`}
                  onClick={() => setMatchesFilter('nearby')}
                >
                  📍 Nearby ({potentialMatches.filter(m => m.matchType === 'nearby').length})
                </button>
              </div>

              {/* Matches Grid */}
              <div className="match-grid">
                {(filteredMatches || []).map(match => (
                  <div key={match.id} className="match-card">
                    <div className="match-header">
                      <div className="match-image">
                        <img
                          src={
                            match.profileImage && match.profileImage.startsWith('http')
                              ? match.profileImage
                              : 'https://via.placeholder.com/60x60?text=User'
                          }
                          alt={match.name}
                          onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/60x60?text=User'; }}
                        />
                        {match.verified && <div className="match-verified">✓</div>}
                      </div>
                      <div className="compatibility-score" style={{ backgroundColor: getCompatibilityColor(match.compatibility) }}>
                        {match.compatibility}%
                      </div>
                    </div>

                    <div className="match-info">
                      <h4 className="match-name">{match.name}, {match.age}</h4>
                      <p className="match-course">{match.course} • {match.year}</p>
                      <p className="match-college">{match.college}</p>

                      <div className="match-type">
                        <span className="match-type-icon">{getMatchTypeIcon(match.matchType)}</span>
                        <span className="match-type-text">{getMatchTypeText(match.matchType)}</span>
                      </div>

                      <div className="match-preferences">
                        <div className="preference-item">
                          <span className="pref-label">Budget:</span>
                          <span className="pref-value">₹{match.budget.toLocaleString()}</span>
                        </div>
                        <div className="preference-item">
                          <span className="pref-label">Room:</span>
                          <span className="pref-value">{match.roomPreference}</span>
                        </div>
                        <div className="preference-item">
                          <span className="pref-label">Sleep:</span>
                          <span className="pref-value">{match.sleepSchedule}</span>
                        </div>
                      </div>

                      <div className="match-interests">
                        {(match.interests || []).slice(0, 3).map((interest, index) => (
                          <span key={index} className="interest-tag">{interest}</span>
                        ))}
                      </div>

                      <p className="match-bio">{match.bio}</p>
                    </div>

                    <div className="match-action">
                      {match.requestSent ? (
                        <button className="btn-success request-sent">
                          ✓ Request Sent
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn-secondary message-match"
                            onClick={() => handleSendMessage(match.id, match.name)}
                          >
                            💬 Message
                          </button>
                          <button
                            className="btn-primary request-match"
                            onClick={() => handleSendRequest(match.id, match.name)}
                          >
                            🤝 Send Request
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredMatches.length === 0 && (
                <div className="no-matches">
                  <div className="no-matches-icon">🔍</div>
                  <h3>No matches found</h3>
                  <p>Try changing the filter to see more potential roommates.</p>
                </div>
              )}
            </div>
          </div>

          <Footer />
          {/* Sticky CTA Bar */}
          <div className="hd-sticky-cta">
            <div className="hd-cta-price">₹{(hostel.startingPrice ?? hostel.price ?? 0).toLocaleString()} <span>/month</span></div>
            <div className="hd-cta-spacer"></div>
            <button className="hero-contact" onClick={handleContactOwner}>📞 Contact Owner</button>
            <button className={`hero-save ${isSaved ? 'saved' : ''}`} onClick={handleSaveHostel}>{isSaved ? '♥ Saved' : '♡ Save'}</button>
          </div>
        </div>
      </div>
      );
      
};

      export default HostelDetail;