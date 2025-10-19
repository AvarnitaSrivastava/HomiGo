import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import roomService from '../services/roomService';
import './HostelDetail.css';

// Student-focused hostel detail page (read-only, includes matches)
const StudentHostelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
  const [matchesFilter, setMatchesFilter] = useState('all'); // all, in-hostel, looking-for, nearby

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await roomService.getRoomDetails(id);
        if (response.success) {
          setHostel(response.data);
        } else {
          setHostel(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();

    // Always fetch matches on student view
    import('../services/matchService').then(({ default: matchService }) => {
      matchService.getMatches()
        .then(matches => {
          const filtered = matches.filter(m => m.hostelId === id || m.matchType === 'in-hostel');
          setPotentialMatches(filtered);
        })
        .catch(() => setPotentialMatches([]));
    });
  }, [id]);

  const showToast = (message, type = 'success') => setToast({ message, type, isVisible: true });
  const hideToast = () => setToast(prev => ({ ...prev, isVisible: false }));

  const handleSaveHostel = () => {
    setIsSaved(!isSaved);
    showToast(isSaved ? 'Removed from saved hostels' : 'Hostel saved successfully!', 'success');
  };
  const handleContactOwner = () => setShowContactForm(true);

  const handleSendMessage = (matchId, matchName) => showToast(`Message sent to ${matchName}!`, 'success');
  const handleSendRequest = (matchId, matchName) => {
    setPotentialMatches(prev => prev.map(match => match.id === matchId ? { ...match, requestSent: true } : match));
    showToast(`Roommate request sent to ${matchName}!`, 'success');
  };

  const getCompatibilityColor = (score) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#F59E0B';
    if (score >= 70) return '#EF4444';
    return '#6B7280';
  };
  const getMatchTypeText = (type) => type === 'in-hostel' ? 'Currently living here' : type === 'looking-for' ? 'Looking for this hostel' : type === 'nearby' ? 'Lives nearby' : '';
  const getMatchTypeIcon = (type) => type === 'in-hostel' ? '🏠' : type === 'looking-for' ? '🔍' : type === 'nearby' ? '📍' : '';

  const filteredMatches = potentialMatches.filter(m => matchesFilter === 'all' ? true : m.matchType === matchesFilter);

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
            <button onClick={() => navigate('/hostels')} className="btn-primary">Back to Listings</button>
          </div>
        </div>
      </div>
    );
  }

  const ownerName = typeof hostel.owner === 'string' ? hostel.owner : (hostel.owner?.fullname || hostel.owner?.name || 'Owner');
  const ownerInitial = (ownerName || 'O').charAt(0).toUpperCase();
  const rents = hostel.rents || { single: 0, double: 0, triple: 0 };
  const hasAnyRent = !!(Number(rents.single) || Number(rents.double) || Number(rents.triple));
  const rulesArray = Array.isArray(hostel.rules) && hostel.rules.length > 0
    ? hostel.rules
    : ((hostel.houseRules || '').split(/\n|\.|,|;/).map(r => r.trim()).filter(Boolean));
  const nearbyChips = Array.isArray(hostel.nearbyPlaces) && hostel.nearbyPlaces.length > 0
    ? hostel.nearbyPlaces.map(p => (p?.name ? p.name : typeof p === 'string' ? p : '')).filter(Boolean)
    : ((hostel.whatsNearby || '').split(/\n|,|;/).map(p => p.trim()).filter(Boolean));

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="main-content">
        <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />

        <div className="hostel-detail-container">
          <div className="hostel-detail-header">
            <button onClick={() => navigate('/hostels')} className="back-btn">← Back to Listings</button>
            <div className="hostel-detail-actions">
              <button onClick={handleSaveHostel} className={`save-hostel-btn ${isSaved ? 'saved' : ''}`}>
                <span className="icon">{isSaved ? '❤️' : '🤍'}</span>
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          {/* Hostel Images */}
          <div className="hostel-images-section">
            <div className="main-image">
              <img 
                src={hostel.images && hostel.images[activeImageIndex] ? hostel.images[activeImageIndex] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'}
                alt={hostel.name || 'Hostel'}
                className="hostel-main-image"
                onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'; }}
              />
            </div>
            <div className="image-thumbnails">
              {(hostel.images && hostel.images.length > 0 ? hostel.images : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80']).map((img, idx) => (
                <img key={idx} src={img} alt={`Hostel thumbnail ${idx+1}`} className={`thumbnail ${activeImageIndex === idx ? 'active' : ''}`} onClick={() => setActiveImageIndex(idx)} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'; }} />
              ))}
            </div>
          </div>

          {/* Hostel Information */}
          <div className="hostel-contentt">
            <div className="hostel-main-info">
              <div className="hostel-title-section">
                <div className="hostel-title-row">
                  <h1 className="hostel-title">{hostel.name}</h1>
                  {hostel.verified && <span className="verified-badge">✓ Verified</span>}
                </div>
                <div className="hostel-location-row">
                  <span className="location">📍 {hostel.location}</span>
                  <span className="distance">{hostel.distance}km away</span>
                </div>
                <div className="hostel-rating-row">
                  <div className="rating"><span className="stars">⭐ {hostel.rating}</span><span className="reviews">({hostel.reviews} reviews)</span></div>
                  <span className="last-updated">Updated {hostel.lastUpdated}</span>
                </div>
              </div>

              <div className="hostel-price-availability">
                <div className="price-section"><div className="price">₹{(hostel.startingPrice ?? hostel.price).toLocaleString()}</div><div className="price-label">per month</div></div>
                <div className="availability-section">
                  <div className={`availability-status ${hostel.available ? 'available' : 'unavailable'}`}>{hostel.available ? '✓ Available' : '✗ Fully Occupied'}</div>
                  {hostel.available && (<div className="rooms-available">{hostel.availableRooms} of {hostel.totalRooms} rooms available</div>)}
                </div>
              </div>

              {/* Room Rents */}
              <div className="hostel-rents" style={{ marginTop: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Room Rents</h3>
                {hasAnyRent ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Number(rents.single) > 0 && (<span className="amenity-tag" style={{ padding: '6px 12px', background: '#f0fdf4', borderRadius: 20, fontSize: 12, color: '#16a34a' }}>Single: ₹{Number(rents.single).toLocaleString()}</span>)}
                    {Number(rents.double) > 0 && (<span className="amenity-tag" style={{ padding: '6px 12px', background: '#f0f9ff', borderRadius: 20, fontSize: 12, color: '#0284c7' }}>Double: ₹{Number(rents.double).toLocaleString()}</span>)}
                    {Number(rents.triple) > 0 && (<span className="amenity-tag" style={{ padding: '6px 12px', background: '#fff7ed', borderRadius: 20, fontSize: 12, color: '#c2410c' }}>Triple: ₹{Number(rents.triple).toLocaleString()}</span>)}
                  </div>
                ) : (<div style={{ color: '#6b7280', fontSize: 14 }}>Not specified</div>)}
              </div>

              <div className="hostel-quick-info">
                <div className="quick-info-item"><span className="icon">👥</span><span className="value">{hostel.occupancy}</span></div>
                <div className="quick-info-item"><span className="icon">🚻</span><span className="value">{hostel.gender}</span></div>
                <div className="quick-info-item"><span className="icon">📍</span><span className="value">{hostel.address}</span></div>
              </div>

              <div className="hostel-description"><h3>About this place</h3><p>{hostel.description || 'Description not provided.'}</p></div>

              <div className="hostel-amenities">
                <h3>Amenities</h3>
                <div className="amenities-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                  {(() => {
                    let amenitiesArr = [];
                    if (Array.isArray(hostel.amenities)) {
                      if (hostel.amenities.length === 1 && typeof hostel.amenities[0] === 'string' && hostel.amenities[0].startsWith('[')) {
                        try {
                          const parsed = JSON.parse(hostel.amenities[0]);
                          amenitiesArr = Array.isArray(parsed) ? parsed : [hostel.amenities[0]];
                        } catch { amenitiesArr = [hostel.amenities[0]]; }
                      } else { amenitiesArr = hostel.amenities; }
                    } else if (typeof hostel.amenities === 'string') {
                      try { const parsed = JSON.parse(hostel.amenities); amenitiesArr = Array.isArray(parsed) ? parsed : [hostel.amenities]; }
                      catch { amenitiesArr = hostel.amenities.includes(',') ? hostel.amenities.split(',').map(a => a.trim()) : [hostel.amenities]; }
                    }
                    return amenitiesArr.length > 0
                      ? amenitiesArr.map((amenity, index) => (
                          <span key={amenity + '-' + index} className="amenity-tag" style={{ padding: '6px 12px', background: '#f0f4ff', borderRadius: '20px', fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="amenity-icon">{['Wi-Fi','Food','AC','Laundry','Gym','Parking'].includes(amenity) ? (amenity==='Wi-Fi'?'📶':amenity==='Food'?'🍽️':amenity==='AC'?'❄️':amenity==='Laundry'?'🧺':amenity==='Gym'?'🏋️':'🅿️') : '✨'}</span>
                            {amenity}
                          </span>
                        ))
                      : <span style={{ color: '#6b7280' }}>No amenities listed</span>;
                  })()}
                </div>
              </div>

              <div className="hostel-rules">
                <h3>House Rules</h3>
                {rulesArray.length > 0 ? (
                  <ul className="rules-list">{rulesArray.map((rule, index) => (<li key={index} className="rule-item"><span className="rule-icon">•</span><span className="rule-text">{rule}</span></li>))}</ul>
                ) : (<div style={{ color: '#6b7280' }}>No specific rules provided.</div>)}
              </div>

              <div className="hostel-nearby">
                <h3>What's nearby</h3>
                {nearbyChips.length > 0 ? (
                  <div className="nearby-places" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {nearbyChips.map((place, index) => (<span key={index} className="amenity-tag" style={{ padding: '6px 12px', background: '#eef2ff', borderRadius: 20, fontSize: 12, color: '#4f46e5' }}>{place}</span>))}
                  </div>
                ) : (<div style={{ color: '#6b7280' }}>No nearby landmarks provided.</div>)}
              </div>

              <div className="hostel-property-details" style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Property Details</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ color: '#374151' }}><strong>Type:</strong> {hostel.propertyType || '—'}</div>
                  <div style={{ color: '#374151' }}><strong>Furnished:</strong> {hostel.furnished ? 'Yes' : 'No'}</div>
                  <div style={{ color: '#374151' }}><strong>Year Built:</strong> {hostel.yearBuilt || '—'}</div>
                </div>
              </div>
            </div>

            <div className="hostel-sidebar">
              <div className="owner-card">
                <h3>Contact Owner</h3>
                <div className="owner-info">
                  <div className="owner-header">
                    <div className="owner-avatar">{ownerInitial}</div>
                    <div className="owner-details">
                      <div className="owner-name">{ownerName}</div>
                      <div className="owner-meta">
                        {hostel.ownerPhone && <div className="response-time">📞 {hostel.ownerPhone}</div>}
                        {hostel.ownerEmail && <div className="joined-date">✉️ {hostel.ownerEmail}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="contact-actions">
                    <button className="btn-primary contact-btn" onClick={handleContactOwner}><span className="icon">📞</span>Contact Owner</button>
                    <button className="btn-secondary message-btn"><span className="icon">💬</span>Send Message</button>
                  </div>
                </div>
              </div>

              <div className="hostel-stats">
                <h4>Quick Stats</h4>
                <div className="stat-item"><span className="stat-label">Total Rooms:</span><span className="stat-value">{hostel.totalRooms}</span></div>
                <div className="stat-item"><span className="stat-label">Available:</span><span className="stat-value">{hostel.availableRooms}</span></div>
                <div className="stat-item"><span className="stat-label">Rating:</span><span className="stat-value">⭐ {hostel.rating}/5</span></div>
                <div className="stat-item"><span className="stat-label">Reviews:</span><span className="stat-value">{hostel.reviews}</span></div>
              </div>
            </div>
          </div>

          {/* Potential Matches Section */}
          <div className="potential-matches-section">
            <div className="matches-header">
              <h2>Potential Roommates</h2>
              <p className="matches-subtitle">Compatible people who are in this hostel, looking for it, or nearby</p>
            </div>

            <div className="matches-filter">
              <button className={`filter-btn ${matchesFilter === 'all' ? 'active' : ''}`} onClick={() => setMatchesFilter('all')}>All ({potentialMatches.length})</button>
              <button className={`filter-btn ${matchesFilter === 'in-hostel' ? 'active' : ''}`} onClick={() => setMatchesFilter('in-hostel')}>🏠 Living Here ({potentialMatches.filter(m => m.matchType === 'in-hostel').length})</button>
              <button className={`filter-btn ${matchesFilter === 'looking-for' ? 'active' : ''}`} onClick={() => setMatchesFilter('looking-for')}>🔍 Looking For ({potentialMatches.filter(m => m.matchType === 'looking-for').length})</button>
              <button className={`filter-btn ${matchesFilter === 'nearby' ? 'active' : ''}`} onClick={() => setMatchesFilter('nearby')}>📍 Nearby ({potentialMatches.filter(m => m.matchType === 'nearby').length})</button>
            </div>

            <div className="match-grid">
              {(filteredMatches || []).map(match => (
                <div key={match.id} className="match-card">
                  <div className="match-header">
                    <div className="match-image">
                      <img 
                        src={match.profileImage && match.profileImage.startsWith('http') ? match.profileImage : 'https://via.placeholder.com/60x60?text=User'}
                        alt={match.name}
                        onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/60x60?text=User'; }}
                      />
                      {match.verified && <div className="match-verified">✓</div>}
                    </div>
                    <div className="compatibility-score" style={{backgroundColor: getCompatibilityColor(match.compatibility)}}>{match.compatibility}%</div>
                  </div>

                  <div className="match-info">
                    <h4 className="match-name">{match.name}, {match.age}</h4>
                    <p className="match-course">{match.course} • {match.year}</p>
                    <p className="match-college">{match.college}</p>
                    <div className="match-type"><span className="match-type-icon">{getMatchTypeIcon(match.matchType)}</span><span className="match-type-text">{getMatchTypeText(match.matchType)}</span></div>
                    <div className="match-preferences">
                      <div className="preference-item"><span className="pref-label">Budget:</span><span className="pref-value">₹{match.budget.toLocaleString()}</span></div>
                      <div className="preference-item"><span className="pref-label">Room:</span><span className="pref-value">{match.roomPreference}</span></div>
                      <div className="preference-item"><span className="pref-label">Sleep:</span><span className="pref-value">{match.sleepSchedule}</span></div>
                    </div>
                    <div className="match-interests">{(match.interests || []).slice(0, 3).map((interest, index) => (<span key={index} className="interest-tag">{interest}</span>))}</div>
                    <p className="match-bio">{match.bio}</p>
                  </div>

                  <div className="match-action">
                    {match.requestSent ? (
                      <button className="btn-success request-sent">✓ Request Sent</button>
                    ) : (
                      <>
                        <button className="btn-secondary message-match" onClick={() => handleSendMessage(match.id, match.name)}>💬 Message</button>
                        <button className="btn-primary request-match" onClick={() => handleSendRequest(match.id, match.name)}>🤝 Send Request</button>
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
      </div>
    </div>
  );
};

export default StudentHostelDetail;
