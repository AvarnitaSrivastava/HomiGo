import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import roomService from '../services/roomService';
import './HostelDetail.css';

// Owner-focused hostel detail page with edit rights and no matches section
const OwnerHostelDetail = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [hostel, setHostel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type, isVisible: true });
    const hideToast = () => setToast(prev => ({ ...prev, isVisible: false }));

    // Redirect non-owners to the public student view
    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = String(u?._id || u?.id || '');
            if (u?.role !== 'owner') {
                navigate(`/hostel/${id}`, { replace: true });
            }
        } catch { }
    }, [id, navigate]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const resp = await roomService.getRoomDetails(id);
                if (resp.success) {
                    const d = resp.data;
                    setHostel(d);
                    // Parse amenities robustly for editing
                    let amenitiesArr = [];
                    if (Array.isArray(d.amenities)) {
                        if (d.amenities.length === 1 && typeof d.amenities[0] === 'string' && d.amenities[0].startsWith('[')) {
                            try {
                                const parsed = JSON.parse(d.amenities[0]);
                                if (Array.isArray(parsed)) amenitiesArr = parsed;
                                else amenitiesArr = [d.amenities[0]];
                            } catch { amenitiesArr = [d.amenities[0]]; }
                        } else { amenitiesArr = d.amenities; }
                    } else if (typeof d.amenities === 'string') {
                        try {
                            const parsed = JSON.parse(d.amenities);
                            if (Array.isArray(parsed)) amenitiesArr = parsed;
                            else amenitiesArr = [d.amenities];
                        } catch {
                            if (d.amenities.includes(',')) amenitiesArr = d.amenities.split(',').map(a => a.trim());
                            else amenitiesArr = [d.amenities];
                        }
                    }
                    // Prefer detailed rent structure if available
                    const rd = d.rentDetails || d.rents || {};
                    setEditData({
                        title: d.name || '',
                        description: d.description || '',
                        address: d.address || d.location || '',
                        price: Number(d.price) || 0,
                        availableRooms: Number(d.availableRooms) || 0,
                        roomType: d.occupancy?.toLowerCase().includes('2') ? 'shared' : (d.occupancy?.toLowerCase().includes('1') ? 'single' : 'shared'),
                        amenities: amenitiesArr,
                        preferences: { gender: (d.gender || 'any').toLowerCase(), foodPreferences: 'any' },
                        rents: {
                            single: {
                                rent: Number(rd?.single?.rent ?? d.rents?.single ?? 0) || 0,
                                available: !!(rd?.single?.available),
                                count: Number(rd?.single?.count ?? 0) || 0
                            },
                            double: {
                                rent: Number(rd?.double?.rent ?? d.rents?.double ?? 0) || 0,
                                available: !!(rd?.double?.available),
                                count: Number(rd?.double?.count ?? 0) || 0
                            },
                            triple: {
                                rent: Number(rd?.triple?.rent ?? d.rents?.triple ?? 0) || 0,
                                available: !!(rd?.triple?.available),
                                count: Number(rd?.triple?.count ?? 0) || 0
                            }
                        },
                        houseRules: d.houseRules || '',
                        whatsNearby: d.whatsNearby || '',
                        propertyType: d.propertyType || '',
                        totalRooms: Number(d.totalRooms) || 0,
                        yearBuilt: d.yearBuilt || '',
                        furnished: !!d.furnished,
                        ownerName: d.ownerName || '',
                        ownerPhone: d.ownerPhone || '',
                        ownerEmail: d.ownerEmail || ''
                    });
                    // Optional: ensure the current user owns this listing
                    try {
                        const u = JSON.parse(localStorage.getItem('user') || '{}');
                        const userId = String(u?._id || u?.id || '');
                        const listingOwnerId = String(d?.ownerId || '');
                        // Debug log
                        // console.log('User ID:', userId, 'Listing Owner ID:', listingOwnerId);
                        if (d?.ownerId && u?.role === 'owner' && userId !== listingOwnerId) {
                            navigate(`/hostel/${id}`, { replace: true });
                            return;
                        }
                    } catch { }

                    // Auto-open editor if requested
                    if (searchParams.get('edit') === '1') setIsEditing(true);
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, searchParams]);

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditData(prev => {
            if (!prev) return prev;
            if (name.startsWith('preferences.')) {
                const k = name.split('.')[1];
                return { ...prev, preferences: { ...prev.preferences, [k]: value } };
            }
            if (name.startsWith('rents.')) {
                // rents.single.rent, rents.single.available, rents.single.count
                const [, roomType, field] = name.split('.');
                let fieldValue = value;
                if (type === 'checkbox') {
                    fieldValue = checked;
                } else if (type === 'number') {
                    fieldValue = value === '' ? '' : Number(value);
                }
                return {
                    ...prev,
                    rents: {
                        ...prev.rents,
                        [roomType]: {
                            ...prev.rents[roomType],
                            [field]: fieldValue
                        }
                    }
                };
            }
            if (name === 'furnished') {
                return { ...prev, furnished: type === 'checkbox' ? checked : value };
            }
            return { ...prev, [name]: type === 'number' ? Number(value) : value };
        });
    };

    const parseAmenitiesInput = (val) => Array.isArray(val) ? val : String(val || '').split(',').map(a => a.trim()).filter(Boolean);

    const handleSaveEdits = async () => {
        try {
            // Parse amenities robustly for saving
            let amenitiesArr = [];
            if (Array.isArray(editData.amenities)) {
                amenitiesArr = editData.amenities.map(a => (typeof a === 'string' ? a.trim() : a)).filter(Boolean);
            } else if (typeof editData.amenities === 'string') {
                if (editData.amenities.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(editData.amenities);
                        if (Array.isArray(parsed)) amenitiesArr = parsed;
                        else amenitiesArr = [editData.amenities];
                    } catch { amenitiesArr = [editData.amenities]; }
                } else if (editData.amenities.includes(',')) {
                    amenitiesArr = editData.amenities.split(',').map(a => a.trim()).filter(Boolean);
                } else {
                    amenitiesArr = [editData.amenities];
                }
            }
            // Ensure rent values are properly formatted as numbers
            const rentsData = {
                single: {
                    rent: Number(editData.rents?.single?.rent) || 0,
                    available: !!editData.rents?.single?.available,
                    count: Number(editData.rents?.single?.count) || 0
                },
                double: {
                    rent: Number(editData.rents?.double?.rent) || 0,
                    available: !!editData.rents?.double?.available,
                    count: Number(editData.rents?.double?.count) || 0
                },
                triple: {
                    rent: Number(editData.rents?.triple?.rent) || 0,
                    available: !!editData.rents?.triple?.available,
                    count: Number(editData.rents?.triple?.count) || 0
                }
            };
            

            const payload = {
                title: editData.title,
                description: editData.description,
                address: editData.address,
                price: Number(editData.price) || 0,
                availableRooms: Number(editData.availableRooms) || 0,
                roomType: editData.roomType,
                amenities: amenitiesArr,
                preferences: editData.preferences,
                rents: rentsData,
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
                }
            } else {
                showToast(resp.message || 'Failed to update listing', 'error');
            }
        } catch (e) {
            showToast(e?.message || 'Failed to update listing', 'error');
        }
    };

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

    // Ensure rents is always defined before using it in JSX
    const rents = hostel && (hostel.rentDetails || hostel.rents)
        ? (hostel.rentDetails || {
            single: { rent: hostel.rents.single, available: false, count: 0 },
            double: { rent: hostel.rents.double, available: false, count: 0 },
            triple: { rent: hostel.rents.triple, available: false, count: 0 }
        })
        : { single: {}, double: {}, triple: {} };
    const hasAnyRent = Boolean(
        (rents.single && Number(rents.single.rent) > 0) ||
        (rents.double && Number(rents.double.rent) > 0) ||
        (rents.triple && Number(rents.triple.rent) > 0)
    );

    // Compute available rooms as the sum of available counts across room types
    const computedAvailableRooms =
        (rents.single?.available ? Number(rents.single?.count || 0) : 0) +
        (rents.double?.available ? Number(rents.double?.count || 0) : 0) +
        (rents.triple?.available ? Number(rents.triple?.count || 0) : 0);

    // Ensure rulesArray is always defined before using it in JSX
    const rulesArray = hostel && hostel.houseRules
        ? (Array.isArray(hostel.houseRules)
            ? hostel.houseRules
            : String(hostel.houseRules).split(/\n|,/).map(r => r.trim()).filter(Boolean))
        : [];

    // Ensure nearbyChips is always defined before using it in JSX
    const nearbyChips = hostel && hostel.whatsNearby
        ? (Array.isArray(hostel.whatsNearby)
            ? hostel.whatsNearby
            : String(hostel.whatsNearby).split(/\n|,/).map(n => n.trim()).filter(Boolean))
        : [];

    // Ensure ownerInitial is always defined before using it in JSX
    const ownerName = hostel && hostel.ownerName ? hostel.ownerName : '';
    const ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : '';

    return (
        <div className="dashboard-page owner-dashboard-fullheight">
            <div className="dashboard-content-row" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                <Sidebar />
                <div className="main-content owner-main-content-fullheight">
                    <div className="owner-hostel-inner" style={{ padding: '32px 32px 0 32px', minHeight: 'calc(100vh - 64px)' }}>
                        <div className="hostel-detail-header">
                            <button onClick={() => navigate('/owner-listings')} className="back-btn">← Back to My Listings</button>
                            <div className="hostel-detail-actions">
                                <button onClick={() => setIsEditing(v => !v)} className="save-hostel-btn" style={{ background: isEditing ? '#fef3c7' : '#e5e7eb', color: '#111827' }}>
                                    ✏️ {isEditing ? 'Close Editor' : 'Edit Listing'}
                                </button>
                            </div>
                        </div>

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
                                    <img key={idx} src={img} alt={`Hostel thumbnail ${idx + 1}`} className={`thumbnail ${activeImageIndex === idx ? 'active' : ''}`} onClick={() => setActiveImageIndex(idx)} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'; }} />
                                ))}
                            </div>
                        </div>

                        {/* Modern Owner Edit Panel */}
                        {isEditing && editData && (
                            <div className="modern-edit-panel">
                                <div className="edit-panel-header">
                                    <div className="edit-header-content">
                                        <h3>✏️ Edit Listing Details</h3>
                                        <p>Update your property information and pricing</p>
                                    </div>
                                    <button className="close-edit-btn" onClick={() => setIsEditing(false)}>
                                        <span>×</span>
                                    </button>
                                </div>

                                <div className="edit-form-sections">
                                    {/* Basic Information Section */}
                                    <div className="edit-section">
                                        <div className="edit-section-header">
                                            <h4>🏠 Basic Information</h4>
                                        </div>
                                        <div className="edit-form-grid">
                                            <div className="edit-form-group">
                                                <label>Property Title</label>
                                                <input
                                                    name="title"
                                                    value={editData.title}
                                                    onChange={handleEditChange}
                                                    placeholder="Enter property title"
                                                />
                                            </div>
                                            <div className="edit-form-group">
                                                <label>Address</label>
                                                <input
                                                    name="address"
                                                    value={editData.address}
                                                    onChange={handleEditChange}
                                                    placeholder="Complete address"
                                                />
                                            </div>
                                            <div className="edit-form-group">
                                                <label>Room Type</label>
                                                <select name="roomType" value={editData.roomType} onChange={handleEditChange}>
                                                    <option value="single">Single</option>
                                                    <option value="shared">Shared</option>
                                                </select>
                                            </div>
                                            <div className="edit-form-group full-width">
                                                <label>Description</label>
                                                <textarea
                                                    name="description"
                                                    rows={3}
                                                    value={editData.description}
                                                    onChange={handleEditChange}
                                                    placeholder="Describe your property..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Room Configuration Section */}
                                    <div className="edit-section">
                                        <div className="edit-section-header">
                                            <h4>💰 Room Pricing & Availability</h4>
                                        </div>
                                        <div className="edit-rent-cards">
                                            {/* Single Room Card */}
                                            <div className={`edit-rent-card ${editData.rents?.single?.available ? 'available' : ''}`}>
                                                <div className="edit-rent-header">
                                                    <div className="rent-type-info">
                                                        <span className="rent-icon">🛏️</span>
                                                        <span className="rent-label">Single Room</span>
                                                    </div>
                                                    <label className="edit-toggle">
                                                        <input
                                                            type="checkbox"
                                                            name="rents.single.available"
                                                            checked={!!editData.rents?.single?.available}
                                                            onChange={handleEditChange}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                {editData.rents?.single?.available && (
                                                    <div className="edit-rent-inputs">
                                                        <div className="input-group">
                                                            <label>Rent (₹)</label>
                                                            <input
                                                                type="number"
                                                                name="rents.single.rent"
                                                                value={editData.rents?.single?.rent || ''}
                                                                onChange={handleEditChange}
                                                                placeholder="8000"
                                                            />
                                                        </div>
                                                        <div className="input-group">
                                                            <label>Available</label>
                                                            <input
                                                                type="number"
                                                                name="rents.single.count"
                                                                value={editData.rents?.single?.count || ''}
                                                                onChange={handleEditChange}
                                                                placeholder="5"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Double Room Card */}
                                            <div className={`edit-rent-card ${editData.rents?.double?.available ? 'available' : ''}`}>
                                                <div className="edit-rent-header">
                                                    <div className="rent-type-info">
                                                        <span className="rent-icon">🛏️🛏️</span>
                                                        <span className="rent-label">Double Sharing</span>
                                                    </div>
                                                    <label className="edit-toggle">
                                                        <input
                                                            type="checkbox"
                                                            name="rents.double.available"
                                                            checked={!!editData.rents?.double?.available}
                                                            onChange={handleEditChange}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                {editData.rents?.double?.available && (
                                                    <div className="edit-rent-inputs">
                                                        <div className="input-group">
                                                            <label>Rent (₹)</label>
                                                            <input
                                                                type="number"
                                                                name="rents.double.rent"
                                                                value={editData.rents?.double?.rent || ''}
                                                                onChange={handleEditChange}
                                                                placeholder="6000"
                                                            />
                                                        </div>
                                                        <div className="input-group">
                                                            <label>Available</label>
                                                            <input
                                                                type="number"
                                                                name="rents.double.count"
                                                                value={editData.rents?.double?.count || ''}
                                                                onChange={handleEditChange}
                                                                placeholder="10"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Triple Room Card */}
                                            <div className={`edit-rent-card ${editData.rents?.triple?.available ? 'available' : ''}`}>
                                                <div className="edit-rent-header">
                                                    <div className="rent-type-info">
                                                        <span className="rent-icon">🛏️🛏️🛏️</span>
                                                        <span className="rent-label">Triple Sharing</span>
                                                    </div>
                                                    <label className="edit-toggle">
                                                        <input
                                                            type="checkbox"
                                                            name="rents.triple.available"
                                                            checked={!!editData.rents?.triple?.available}
                                                            onChange={handleEditChange}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                {editData.rents?.triple?.available && (
                                                    <div className="edit-rent-inputs">
                                                        <div className="input-group">
                                                            <label>Rent (₹)</label>
                                                            <input
                                                                type="number"
                                                                name="rents.triple.rent"
                                                                value={editData.rents?.triple?.rent || ''}
                                                                onChange={handleEditChange}
                                                                placeholder="5000"
                                                            />
                                                        </div>
                                                        <div className="input-group">
                                                            <label>Available</label>
                                                            <input
                                                                type="number"
                                                                name="rents.triple.count"
                                                                value={editData.rents?.triple?.count || ''}
                                                                onChange={handleEditChange}
                                                                placeholder="8"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Details Section */}
                                    <div className="edit-section">
                                        <div className="edit-section-header">
                                            <h4>📋 Additional Details</h4>
                                        </div>
                                        <div className="edit-form-grid">
                                            <div className="edit-form-group full-width">
                                                <label>Amenities (comma-separated)</label>
                                                <input
                                                    name="amenities"
                                                    value={Array.isArray(editData.amenities) ? editData.amenities.join(', ') : (editData.amenities || '')}
                                                    onChange={handleEditChange}
                                                    placeholder="Wi-Fi, AC, Food, Laundry..."
                                                />
                                            </div>
                                            <div className="edit-form-group full-width">
                                                <label>House Rules</label>
                                                <textarea
                                                    name="houseRules"
                                                    rows={3}
                                                    value={editData.houseRules}
                                                    onChange={handleEditChange}
                                                    placeholder="No smoking, No loud music after 10 PM..."
                                                />
                                            </div>
                                            <div className="edit-form-group full-width">
                                                <label>What's Nearby</label>
                                                <textarea
                                                    name="whatsNearby"
                                                    rows={2}
                                                    value={editData.whatsNearby}
                                                    onChange={handleEditChange}
                                                    placeholder="Metro station 5 min walk, College nearby..."
                                                />
                                            </div>
                                            <div className="edit-form-group">
                                                <label>Property Type</label>
                                                <input
                                                    name="propertyType"
                                                    value={editData.propertyType}
                                                    onChange={handleEditChange}
                                                    placeholder="PG, Hostel, Apartment"
                                                />
                                            </div>
                                            <div className="edit-form-group">
                                                <label>Total Rooms</label>
                                                <input
                                                    type="number"
                                                    name="totalRooms"
                                                    value={editData.totalRooms}
                                                    onChange={handleEditChange}
                                                    placeholder="20"
                                                />
                                            </div>
                                            <div className="edit-form-group">
                                                <label>Year Built</label>
                                                <input
                                                    name="yearBuilt"
                                                    value={editData.yearBuilt}
                                                    onChange={handleEditChange}
                                                    placeholder="2020"
                                                />
                                            </div>
                                            <div className="edit-form-group">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        name="furnished"
                                                        checked={!!editData.furnished}
                                                        onChange={handleEditChange}
                                                    />
                                                    <span className="checkmark"></span>
                                                    Furnished Property
                                                </label>
                                            </div>
                                            <div className="edit-form-group">
                                                <label>Owner Name</label>
                                                <input
                                                    name="ownerName"
                                                    value={editData.ownerName}
                                                    onChange={handleEditChange}
                                                    placeholder="Your name"
                                                />
                                            </div>
                                            <div className="edit-form-group">
                                                <label>Owner Phone</label>
                                                <input
                                                    name="ownerPhone"
                                                    value={editData.ownerPhone}
                                                    onChange={handleEditChange}
                                                    placeholder="9876543210"
                                                />
                                            </div>
                                            <div className="edit-form-group">
                                                <label>Owner Email</label>
                                                <input
                                                    name="ownerEmail"
                                                    value={editData.ownerEmail}
                                                    onChange={handleEditChange}
                                                    placeholder="owner@email.com"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="edit-panel-actions">
                                    <button className="btn-save" onClick={handleSaveEdits}>
                                        <span className="btn-icon">💾</span>
                                        Save Changes
                                    </button>
                                    <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                                        <span className="btn-icon">✕</span>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Main info (read-only presentation) */}
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
                                    <div style={{ display: 'flex', gap: 16, margin: '0 0 0 0' }}>
                                        {/* Single Room Display */}
                                        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px 24px', minWidth: 120, textAlign: 'center', boxShadow: '0 1px 2px rgba(16,185,129,0.07)' }}>
                                            <div style={{ fontWeight: 600, color: '#16a34a', fontSize: 15 }}>Single</div>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>₹{rents.single?.rent ?? '—'}</div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>per month</div>
                                            <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
                                                {rents.single?.available ? `${rents.single?.count || 0} available` : 'Not available'}
                                            </div>
                                        </div>
                                        {/* Double Room Display */}
                                        <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '12px 24px', minWidth: 120, textAlign: 'center', boxShadow: '0 1px 2px rgba(2,132,199,0.07)' }}>
                                            <div style={{ fontWeight: 600, color: '#0284c7', fontSize: 15 }}>2 Sharing</div>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>₹{rents.double?.rent ?? '—'}</div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>per month</div>
                                            <div style={{ fontSize: 12, color: '#0284c7', marginTop: 4 }}>
                                                {rents.double?.available ? `${rents.double?.count || 0} available` : 'Not available'}
                                            </div>
                                        </div>
                                        {/* Triple Room Display */}
                                        <div style={{ background: '#fff7ed', borderRadius: 12, padding: '12px 24px', minWidth: 120, textAlign: 'center', boxShadow: '0 1px 2px rgba(194,65,12,0.07)' }}>
                                            <div style={{ fontWeight: 600, color: '#c2410c', fontSize: 15 }}>3 Sharing</div>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>₹{rents.triple?.rent ?? '—'}</div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>per month</div>
                                            <div style={{ fontSize: 12, color: '#c2410c', marginTop: 4 }}>
                                                {rents.triple?.available ? `${rents.triple?.count || 0} available` : 'Not available'}
                                            </div>
                                        </div>
                                    </div>

                                </div>

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
                                                    } catch { amenitiesArr = [hostel.amenities[0]]; }
                                                } else { amenitiesArr = hostel.amenities; }
                                            } else if (typeof hostel.amenities === 'string') {
                                                try {
                                                    const parsed = JSON.parse(hostel.amenities);
                                                    if (Array.isArray(parsed)) amenitiesArr = parsed;
                                                    else amenitiesArr = [hostel.amenities];
                                                } catch {
                                                    if (hostel.amenities.includes(',')) amenitiesArr = hostel.amenities.split(',').map(a => a.trim());
                                                    else amenitiesArr = [hostel.amenities];
                                                }
                                            }
                                            return amenitiesArr.length > 0
                                                ? amenitiesArr.map((amenity, index) => (
                                                    <span key={amenity + '-' + index} className="amenity-tag" style={{ padding: '6px 12px', background: '#f0f4ff', borderRadius: '20px', fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span className="amenity-icon">{['Wi-Fi', 'Food', 'AC', 'Laundry', 'Gym', 'Parking', 'Security'].includes(amenity) ? (amenity === 'Wi-Fi' ? '📶' : amenity === 'Food' ? '🍽️' : amenity === 'AC' ? '❄️' : amenity === 'Laundry' ? '🧺' : amenity === 'Gym' ? '🏋️' : amenity === 'Parking' ? '🅿️' : '🛡️') : '✨'}</span>
                                                        {amenity}
                                                    </span>
                                                ))
                                                : <span style={{ color: '#6b7280' }}>No amenities listed</span>;
                                        })()}
                                    </div>
                                </div>

                                <div className="hostel-rents" style={{ marginTop: 12 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Room Rents</h3>
                                    {hasAnyRent ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {Number(rents.single?.rent) > 0 && (<span className="amenity-tag" style={{ padding: '6px 12px', background: '#f0fdf4', borderRadius: 20, fontSize: 12, color: '#16a34a' }}>Single: ₹{Number(rents.single?.rent).toLocaleString()}</span>)}
                                            {Number(rents.double?.rent) > 0 && (<span className="amenity-tag" style={{ padding: '6px 12px', background: '#f0f9ff', borderRadius: 20, fontSize: 12, color: '#0284c7' }}>Double: ₹{Number(rents.double?.rent).toLocaleString()}</span>)}
                                            {Number(rents.triple?.rent) > 0 && (<span className="amenity-tag" style={{ padding: '6px 12px', background: '#fff7ed', borderRadius: 20, fontSize: 12, color: '#c2410c' }}>Triple: ₹{Number(rents.triple?.rent).toLocaleString()}</span>)}
                                        </div>
                                    ) : (<div style={{ color: '#6b7280', fontSize: 14 }}>Not specified</div>)}
                                </div>

                                <div className="hostel-description"><h3>About this place</h3><p>{hostel.description || 'Description not provided.'}</p></div>

                                <div className="hostel-rules">
                                    <h3>House Rules</h3>
                                    {rulesArray.length > 0 ? (
                                        <ul className="rules-list">{rulesArray.map((rule, i) => (<li key={i} className="rule-item"><span className="rule-icon">•</span><span className="rule-text">{rule}</span></li>))}</ul>
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
                                    </div>
                                </div>

                                <div className="hostel-stats">
                                    <h4>Quick Stats</h4>
                                    <div className="stat-item"><span className="stat-label">Total Rooms:</span><span className="stat-value">{hostel.totalRooms}</span></div>
                                    <div className="stat-item"><span className="stat-label">Available:</span><span className="stat-value">{computedAvailableRooms}</span></div>
                                    <div className="stat-item"><span className="stat-label">Rating:</span><span className="stat-value">⭐ {hostel.rating}/5</span></div>
                                    <div className="stat-item"><span className="stat-label">Reviews:</span><span className="stat-value">{hostel.reviews}</span></div>
                                </div>
                            </div>
                        </div>
                        <Footer />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerHostelDetail;
