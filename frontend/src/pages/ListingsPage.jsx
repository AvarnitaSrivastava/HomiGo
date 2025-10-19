import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ListingCard.css';
import authService from '../services/authService';
import roomService from '../services/roomService';
import './ListingCard.advanced.css';
import Sidebar from '../components/Sidebar';
import '../components/Sidebar.css';


const ListingsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([5000, 20000]);
  const [genderFilter, setGenderFilter] = useState('any');
  const [amenitiesFilter, setAmenitiesFilter] = useState([]);
  const [occupancyFilter, setOccupancyFilter] = useState('any');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [availabilityFilter, setAvailabilityFilter] = useState('any');
  const [distanceFilter, setDistanceFilter] = useState(5);
  const [sortBy, setSortBy] = useState('relevance');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerData, setOwnerData] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Predefined options used by advanced filters. These were referenced in the JSX
  // but not defined, which caused a runtime ReferenceError. Kept as sensible
  // defaults; later we can derive them from fetched listings if desired.
  const allOccupancies = [
    '1 Sharing',
    '2 Sharing',
    '3 Sharing',
    '4 Sharing',
    'Single',
    'Double',
    'Triple',
    'Studio'
  ];

  const allAmenities = [
    'Wi-Fi',
    'Food',
    'Gym',
    'Parking',
    'AC',
    'Laundry',
    'Kitchen',
    'Balcony',
    'Study Room',
    'Garden',
    'Power Backup',
    'Hot Water',
    'TV',
    'Fridge',
    'Security'
  ];

  // Read search parameter from URL on component mount
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search');
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkUserType = async () => {
      const userType = authService.getUserType();
      setIsOwner(userType === 'owner');
      
      if (userType === 'owner') {
        try {
          const response = await authService.getCurrentOwner();
          if (response.success) {
            setOwnerData(response.data);
          }
        } catch (error) {
          console.error('Failed to fetch owner data:', error);
        }
      }
    };

    checkUserType();
  }, []);

  // Fetch listings from backend
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const searchParams = {
          searchTerm,
          priceRange,
          genderFilter,
          amenitiesFilter,
          occupancyFilter,
          ratingFilter,
          distanceFilter,
          sortBy
        };

        const response = await roomService.searchRooms(searchParams);
        
        if (response.success) {
          setListings(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch listings');
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        setError(error.message || 'Failed to load listings');
        // Fallback to empty array
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(fetchListings, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, priceRange, genderFilter, amenitiesFilter, occupancyFilter, ratingFilter, distanceFilter, sortBy]);

  // Filtering logic for frontend-only filters
  let filteredListings = listings.filter(listing => {
    const matchesFilter = filter === 'all' ||
      (filter === 'pg' && listing.type === 'PG') ||
      (filter === 'hostel' && listing.type === 'Hostel') ||
      (filter === 'apartment' && listing.type === 'Apartment');
    const matchesAvailability = availabilityFilter === 'any' || 
      (availabilityFilter === 'available' ? listing.available : !listing.available);
    return matchesFilter && matchesAvailability;
  });

  // Sorting with owner's listings prioritized
  const currentOwnerId = ownerData?._id;
  
  if (isOwner && currentOwnerId) {
    filteredListings = filteredListings.sort((a, b) => {
      // First priority: Show owner's listings first if user is an owner
      const aIsOwners = a.ownerId === currentOwnerId;
      const bIsOwners = b.ownerId === currentOwnerId;
      
      if (aIsOwners && !bIsOwners) return -1;
      if (!aIsOwners && bIsOwners) return 1;
      
      // Second priority: Apply the selected sorting (already handled by backend)
      return 0;
    });
  }

  // Separate owner's listings and other listings for display purposes
  const ownerListings = isOwner && currentOwnerId ? 
    filteredListings.filter(listing => listing.ownerId === currentOwnerId) : [];
  const otherListings = isOwner && currentOwnerId ? 
    filteredListings.filter(listing => listing.ownerId !== currentOwnerId) : filteredListings;
  // Filter chips for active filters
  const filterChips = [];
  if (genderFilter !== 'any') filterChips.push({ label: genderFilter.charAt(0).toUpperCase() + genderFilter.slice(1), onRemove: () => setGenderFilter('any') });
  if (amenitiesFilter.length > 0) amenitiesFilter.forEach(a => filterChips.push({ label: a, onRemove: () => setAmenitiesFilter(amenitiesFilter.filter(am => am !== a)) }));
  if (occupancyFilter !== 'any') filterChips.push({ label: occupancyFilter, onRemove: () => setOccupancyFilter('any') });
  if (ratingFilter > 0) filterChips.push({ label: `Rating ${ratingFilter}+`, onRemove: () => setRatingFilter(0) });
  if (availabilityFilter !== 'any') filterChips.push({ label: availabilityFilter === 'available' ? 'Available' : 'Booked', onRemove: () => setAvailabilityFilter('any') });
  if (distanceFilter < 5) filterChips.push({ label: `≤ ${distanceFilter}km`, onRemove: () => setDistanceFilter(5) });

  // Get compatibility color class helper
  const getCompatibilityColor = (score) => {
    if (score >= 90) return 'from-green-400 to-emerald-500';
    if (score >= 80) return 'from-blue-400 to-indigo-500';
    if (score >= 70) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  return (
    <div className={`listing-page-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="listing-page-wrapper">
        {/* Header */}
        <div className="listing-header">
          <div className="listing-header-row">
            <div>
              <h1 className="listing-title">
                <span className="listing-title-icon" role="img" aria-label="building">🏢</span>
                Accommodation Listings
              </h1>
              <p className="listing-subtitle">Find the perfect accommodation that matches your lifestyle and budget</p>
            </div>
            <div className="listing-header-actions">
              <div className="listing-search-wrapper">
                <span className="listing-search-icon" role="img" aria-label="search">🔍</span>
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="listing-search-input"
                />
              </div>
              <button className="btn-secondary listing-advanced-filter-btn" onClick={() => setShowAdvanced(!showAdvanced)}>
                <span className="listing-advanced-filter-icon" role="img" aria-label="filter">⚙️</span>
                Advanced Filters
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="advanced-filters-panel">
            <div className="advanced-filters-row">
              {/* Gender */}
              <div className="advanced-filter-group">
                <label>Gender</label>
                <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                  <option value="any">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              {/* Occupancy */}
              <div className="advanced-filter-group">
                <label>Occupancy</label>
                <select value={occupancyFilter} onChange={e => setOccupancyFilter(e.target.value)}>
                  <option value="any">Any</option>
                  {allOccupancies.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Rating */}
              <div className="advanced-filter-group">
                <label>Min. Rating</label>
                <select value={ratingFilter} onChange={e => setRatingFilter(Number(e.target.value))}>
                  <option value={0}>Any</option>
                  <option value={3}>3+</option>
                  <option value={4}>4+</option>
                  <option value={4.5}>4.5+</option>
                </select>
              </div>
              {/* Availability */}
              <div className="advanced-filter-group">
                <label>Availability</label>
                <select value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)}>
                  <option value="any">Any</option>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                </select>
              </div>
              {/* Distance */}
              <div className="advanced-filter-group">
                <label>Max Distance (km)</label>
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={distanceFilter}
                  onChange={e => setDistanceFilter(Number(e.target.value))}
                  className="advanced-filter-slider"
                />
                <span className="distance-value">{distanceFilter} km</span>
              </div>
            </div>
            
            {/* Amenities in separate row for better spacing */}
            <div className="advanced-filter-group amenities-group">
              <label>Amenities</label>
              <div className="advanced-filter-amenities">
                {allAmenities.map(a => (
                  <div key={a} className="amenity-item">
                    <input
                      type="checkbox"
                      id={`amenity-${a}`}
                      checked={amenitiesFilter.includes(a)}
                      onChange={e => {
                        if (e.target.checked) setAmenitiesFilter([...amenitiesFilter, a]);
                        else setAmenitiesFilter(amenitiesFilter.filter(am => am !== a));
                      }}
                    />
                    <label htmlFor={`amenity-${a}`}>{a}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="advanced-filters-actions">
              <button className="btn-secondary" onClick={() => {
                setGenderFilter('any');
                setAmenitiesFilter([]);
                setOccupancyFilter('any');
                setRatingFilter(0);
                setAvailabilityFilter('any');
                setDistanceFilter(5);
              }}>Clear Filters</button>
              <button className="btn-primary" onClick={() => setShowAdvanced(false)}>Apply</button>
            </div>
          </div>
        )}

        {/* Filter Tabs, Price Range, Sort By */}
        <div className="listing-filters-section">
          <div className="listing-filter-tabs">
            {[
              { id: 'all', label: 'All Types', count: listings.length },
              { id: 'pg', label: 'PG', count: listings.filter(l => l.type === 'PG').length },
              { id: 'hostel', label: 'Hostel', count: listings.filter(l => l.type === 'Hostel').length },
              { id: 'apartment', label: 'Apartment', count: listings.filter(l => l.type === 'Apartment').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`listing-filter-tab ${filter === tab.id ? 'active' : ''}`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="listing-filters-row">
            <div className="listing-price-range-box">
              <label className="listing-price-range-label">Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}</label>
              <input
                type="range"
                min="5000"
                max="20000"
                step="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="listing-price-range-slider"
              />
            </div>
            <div className="listing-sort-by">
              <label>Sort By:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Rating</option>
                <option value="distance">Distance</option>
              </select>
            </div>
          </div>
          {/* Filter Chips */}
          {filterChips.length > 0 && (
            <div className="filter-chips-row">
              {filterChips.map((chip, idx) => (
                <span key={idx} className="filter-chip">
                  {chip.label}
                  <button className="filter-chip-remove" onClick={chip.onRemove}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Listings Grid */}
        <div className="listing-grid">
          {/* Loading State */}
          {loading && (
            <div className="listings-loading">
              <div className="loading-spinner"></div>
              <p>Loading accommodations...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="listings-error">
              <div className="error-icon">⚠️</div>
              <h3>Failed to load listings</h3>
              <p>{error}</p>
              <button 
                className="btn-primary retry-btn"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Results State */}
          {!loading && !error && filteredListings.length === 0 && (
            <div className="listings-empty">
              <div className="empty-icon">🏠</div>
              <h3>No accommodations found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button 
                className="btn-secondary clear-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setGenderFilter('any');
                  setAmenitiesFilter([]);
                  setOccupancyFilter('any');
                  setRatingFilter(0);
                  setAvailabilityFilter('any');
                  setPriceRange([5000, 20000]);
                  setDistanceFilter(5);
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Listings Content */}
          {!loading && !error && filteredListings.length > 0 && (
            <>
              {/* Owner's Listings Section */}
              {isOwner && ownerListings.length > 0 && (
                <>
                  <div className="listings-section-header">
                    <h3 className="listings-section-title">
                      🏢 Your Listings ({ownerListings.length})
                    </h3>
                    <p className="listings-section-subtitle">Manage and view your property listings</p>
                    <button 
                      className="manage-listings-btn"
                      onClick={() => navigate('/owner-listings')}
                    >
                      Manage All Listings
                    </button>
                  </div>
                  {ownerListings.map((listing) => (
                <div key={`owner-${listing.id}`} className="listing-card owner-listing">
                  <div className="owner-listing-label">Your Property</div>
                  <div 
                    className="listing-card-image-wrapper"
                    onClick={() => navigate(`/hostel/${listing.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img className="listing-card-image" src={listing.image} alt={listing.name || listing.title} />
                    {/* Price badge overlay */}
                    <div className="listing-price-badge">
                      <div className="listing-price-badge-inner">₹{(listing.startingPrice ?? listing.price).toLocaleString()}</div>
                      <div className="listing-price-period">/mo</div>
                    </div>
                    {/* Badges */}
                    <div className="listing-card-badges">
                      {listing.featured && (
                        <span className="listing-badge-featured">
                          Featured
                        </span>
                      )}
                      <span className="listing-badge-type">
                        {listing.type}
                      </span>
                      {(listing.ownerName || (listing.owner && listing.owner.fullname)) && (
                        <span className="listing-badge-owner">
                          Owner
                        </span>
                      )}
                    </div>
                    {/* Rating */}
                    <div className="listing-card-rating">
                      <div className="listing-card-rating-inner">
                        <span className="listing-card-rating-star" role="img" aria-label="star">⭐</span>
                        <span className="listing-card-rating-value">{listing.rating}</span>
                      </div>
                    </div>
                    {/* Owner Actions */}
                    <div className="owner-listing-actions">
                      <button 
                        className="owner-action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/owner/edit-listing/${listing.id}`);
                        }}
                      >
                        ✏️
                      </button>
                      <button 
                        className="owner-action-btn stats"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        📊
                      </button>
                    </div>
                  </div>
                  <div className="listing-card-content" onClick={() => navigate(`/hostel/${listing.id}`)}>
                    <div className="listing-card-header">
                      <h3 className="listing-card-title">{listing.name}</h3>
                      <div className="listing-card-verified">
                        {listing.verified && <span className="listing-verified-icon" role="img" aria-label="verified">✅</span>}
                      </div>
                    </div>
                    <div className="listing-card-meta">
                      <div className="listing-card-meta-left">
                        <p className="listing-card-location">📍 {listing.location}</p>
                        <p className="listing-card-distance">{listing.distance} km away</p>
                      </div>
                      <div className="listing-card-meta-right">
                        <p className="listing-card-info-price-value">₹{(listing.startingPrice ?? listing.price).toLocaleString()}</p>
                        <p className="listing-card-info-price-label">/mo • {listing.availableRooms ?? 'N/A'} avail</p>
                      </div>
                    </div>
                    <p className="listing-card-description">{listing.description}</p>
                    {/* Condensed amenities: show up to 3 */}
                    <div className="listing-card-amenities">
                      {(() => {
                        const a = Array.isArray(listing.amenities) ? listing.amenities : [];
                        const visible = a.slice(0, 3);
                        return (
                          <>
                            {visible.map((amenity, idx) => (
                              <span key={idx} className="listing-card-amenity small">{amenity}</span>
                            ))}
                            {a.length > 3 && <span className="listing-card-amenity more">+{a.length - 3} more</span>}
                          </>
                        );
                      })()}
                    </div>
                    <div className="listing-card-footer">
                      <div className="listing-card-owner-summary">
                        <span className="listing-card-owner-name-small">{listing.ownerName || listing.owner || 'Owner'}</span>
                        {listing.verified && <span className="listing-card-owner-verified" role="img" aria-label="verified">✅</span>}
                        <span className="listing-card-sep">•</span>
                        <span className="listing-card-updated-small">{listing.lastUpdated}</span>
                      </div>
                      <div className="listing-card-actions">
                        <button className="btn-primary listing-card-action-contact">
                          <span className="listing-card-action-icon" role="img" aria-label="phone">📞</span>
                          Contact Owner
                        </button>
                        <button className="btn-secondary listing-card-action-fav">❤️</button>
                        <button className="btn-secondary listing-card-action-share">🔗</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Separator for other listings */}
              {otherListings.length > 0 && (
                <div className="listings-section-header">
                  <h3 className="listings-section-title">
                    🔍 Other Available Properties ({otherListings.length})
                  </h3>
                  <p className="listings-section-subtitle">Explore more accommodation options</p>
                </div>
              )}
            </>
          )}

          {/* Other Listings or All Listings for Students */}
          {(isOwner ? otherListings : filteredListings).map((listing) => (
            <div key={listing.id} className="listing-card">
              <div 
                className="listing-card-image-wrapper"
                onClick={() => navigate(`/hostel/${listing.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <img className="listing-card-image" src={listing.image} alt={listing.name} />
                {/* Badges */}
                <div className="listing-card-badges">
                  {listing.featured && (
                    <span className="listing-badge-featured">
                      Featured
                    </span>
                  )}
                  <span className="listing-badge-type">
                    {listing.type}
                  </span>
                </div>
                {/* Rating */}
                <div className="listing-card-rating">
                  <div className="listing-card-rating-inner">
                    <span className="listing-card-rating-star" role="img" aria-label="star">⭐</span>
                    <span className="listing-card-rating-value">{listing.rating}</span>
                  </div>
                </div>
                {/* Compatibility Score */}
                <div className="listing-card-compatibility">
                  <div className={`listing-card-compatibility-inner ${getCompatibilityColor(listing.compatibility)}`}>
                    <span className="listing-card-compatibility-value">{listing.compatibility}%</span>
                  </div>
                </div>
                {/* Availability Status */}
                <div className="listing-card-availability">
                  <span className={`listing-card-availability-status ${listing.available ? 'available' : 'booked'}`}>
                    {listing.available ? 'Available' : 'Booked'}
                  </span>
                </div>
              </div>
              <div className="listing-card-content">
                <div className="listing-card-title-row">
                  <div>
                    <h3 
                      className="listing-card-title"
                      onClick={() => navigate(`/hostel/${listing.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {listing.name || listing.title}
                    </h3>
                    <p className="listing-card-location">
                      <span className="listing-card-location-icon" role="img" aria-label="location">📍</span>
                      {listing.location || listing.address} • {listing.distance}km away
                    </p>
                  </div>
                </div>
                <div className="listing-card-info-row">
                  <div className="listing-card-info-occupancy">
                    <div className="listing-card-info-occupancy-inner">
                      <span className="listing-card-info-occupancy-icon" role="img" aria-label="occupancy">👥</span>
                      <span className="listing-card-info-occupancy-value">{listing.occupancy}</span>
                    </div>
                    <div className="listing-card-info-gender">
                      <span className="listing-card-info-gender-dot">•</span>
                      <span className="listing-card-info-gender-value">{listing.gender}</span>
                    </div>
                  </div>
                  <div className="listing-card-info-price">
                    <p className="listing-card-info-price-value">₹{(listing.startingPrice ?? listing.price).toLocaleString()}</p>
                    <p className="listing-card-info-price-label">per month • {listing.availableRooms ?? 'N/A'} available</p>
                  </div>
                </div>
                <p className="listing-card-description">{listing.description}</p>
                {/* Amenities */}
                <div className="listing-card-amenities">
                  {(() => {
                    let amenitiesArr = [];
                    if (Array.isArray(listing.amenities)) {
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
                      ? amenitiesArr.map((amenity, index) => (
                          <span key={index} className="listing-card-amenity">
                            {amenity === 'Wi-Fi' && <span className="listing-card-amenity-icon" role="img" aria-label="wifi">📶</span>}
                            {amenity === 'Food' && <span className="listing-card-amenity-icon" role="img" aria-label="food">🍽️</span>}
                            {amenity === 'Gym' && <span className="listing-card-amenity-icon" role="img" aria-label="gym">🏋️</span>}
                            {amenity === 'Parking' && <span className="listing-card-amenity-icon" role="img" aria-label="parking">🅿️</span>}
                            {amenity === 'AC' && <span className="listing-card-amenity-icon" role="img" aria-label="ac">❄️</span>}
                            {amenity === 'Laundry' && <span className="listing-card-amenity-icon" role="img" aria-label="laundry">🧺</span>}
                            {amenity === 'Kitchen' && <span className="listing-card-amenity-icon" role="img" aria-label="kitchen">🍳</span>}
                            {amenity === 'Balcony' && <span className="listing-card-amenity-icon" role="img" aria-label="balcony">🏠</span>}
                            {amenity === 'Study Room' && <span className="listing-card-amenity-icon" role="img" aria-label="study room">📚</span>}
                            {amenity === 'Garden' && <span className="listing-card-amenity-icon" role="img" aria-label="garden">🌱</span>}
                            {![
                              'Wi-Fi','Food','Gym','Parking','AC','Laundry','Kitchen','Balcony','Study Room','Garden'
                            ].includes(amenity) && <span className="listing-card-amenity-icon" role="img" aria-label="other">✨</span>}
                            {amenity}
                          </span>
                        ))
                      : <span style={{ color: '#6b7280' }}>No amenities listed</span>;
                  })()}
                </div>
                {/* Owner Info */}
                <div className="listing-card-owner-info">
                  <div className="listing-card-owner-info-inner">
                    <span className="listing-card-owner-label">Owner:</span>
                    <span className="listing-card-owner-name">
                      {listing.ownerName || listing.owner || (listing.owner && listing.owner.fullname) || 'Owner'}
                    </span>
                    {listing.verified && <span className="listing-card-owner-verified" role="img" aria-label="verified">✅</span>}
                  </div>
                  <span className="listing-card-owner-updated">{listing.lastUpdated}</span>
                </div>
                {/* Action Buttons */}
                <div className="listing-card-actions">
                  <button className="btn-primary listing-card-action-contact">
                    <span className="listing-card-action-icon" role="img" aria-label="phone">📞</span>
                    Contact Owner
                  </button>
                  <button className="btn-secondary listing-card-action-fav">
                    <span className="listing-card-action-icon" role="img" aria-label="favorite">❤️</span>
                  </button>
                  <button className="btn-secondary listing-card-action-share">
                    <span className="listing-card-action-icon" role="img" aria-label="share">🔗</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
            </>
          )}
        </div>

        {/* Results Summary */}
        {!loading && !error && filteredListings.length > 0 && (
          <div className="listings-summary">
            <p>
              {isOwner ? (
                `Showing ${ownerListings.length} of your listings and ${otherListings.length} other properties`
              ) : (
                `Found ${filteredListings.length} accommodations matching your criteria`
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingsPage;