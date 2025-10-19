import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import roomService from '../services/roomService';
import './AddNewListing.css';

const AddNewListing = () => {
    // Toggle amenity selection
    const handleAmenityToggle = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };
    // Handle image upload
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                showToast('Please select only image files', 'error');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showToast('Image size should be less than 5MB', 'error');
                return false;
            }
            return true;
        });
        if (validFiles.length > 0) {
            setImages(prev => [...prev, ...validFiles].slice(0, 6)); // Max 6 images
        }
    };
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        price: '',
        rents: {
            single: { rent: '', available: false, count: '' },
            double: { rent: '', available: false, count: '' },
            triple: { rent: '', available: false, count: '' }
        },
        availableRooms: 1,
        roomType: 'shared',
        amenities: [],
        preferences: {
            gender: 'any',
            smoking: false,
            pets: false,
            foodPreferences: 'any'
        },
        houseRules: '',
        whatsNearby: '',
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        propertyType: '',
        totalRooms: '',
        yearBuilt: '',
        furnished: false
    });
    
    const [images, setImages] = useState([]);
    const [errors, setErrors] = useState({});

    // Predefined options
    const amenitiesList = [
        'Wi-Fi', 'AC', 'Food', 'Laundry', 'TV', 'Gym', 'Study Hall', 
        'Parking', 'Security', 'Housekeeping', 'Power Backup', 'Water Heater'
    ];

    // Only 'single' and 'shared' are valid for backend
    const roomTypes = [
        { value: 'single', label: 'Single Room' },
        { value: 'shared', label: 'Double Sharing' },
        { value: 'shared', label: 'Triple Sharing' }
    ];

    // Handle form input changes (updated for all new fields)
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('preferences.')) {
            const prefName = name.split('.')[1];
            setFormData((prev) => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    [prefName]: type === 'checkbox' ? checked : value
                }
            }));
        } else if (name.startsWith('rents.')) {
            // name: rents.single.rent, rents.single.available, rents.single.count, etc.
            const [, roomType, field] = name.split('.');
            setFormData((prev) => ({
                ...prev,
                rents: {
                    ...prev.rents,
                    [roomType]: {
                        ...prev.rents[roomType],
                        [field]: type === 'checkbox' ? checked : value
                    }
                }
            }));
        } else {
            // Handle number fields
            if (type === 'number') {
                setFormData((prev) => ({
                    ...prev,
                    [name]: value === '' ? '' : Number(value)
                }));
            } else if (type === 'checkbox') {
                setFormData((prev) => ({
                    ...prev,
                    [name]: checked
                }));
            } else {
                setFormData((prev) => ({
                    ...prev,
                    [name]: value
                }));
            }
        }
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
                    {/* Room Rents */}
                    <div className="form-section">
                        <div className="section-header">
                            <h2>🏠 Room Configuration & Pricing</h2>
                            <p>Configure room types, availability and pricing for different sharing options</p>
                        </div>
                        <div className="rent-cards-container">
                            {/* Single Room Card */}
                            <div className={`rent-card ${formData.rents.single.available ? 'available' : 'unavailable'}`}>
                                <div className="rent-card-header">
                                    <div className="rent-type-info">
                                        <span className="rent-icon">🛏️</span>
                                        <div>
                                            <h3>Single Occupancy</h3>
                                            <p>Individual room for one person</p>
                                        </div>
                                    </div>
                                    <label className="modern-toggle">
                                        <input
                                            type="checkbox"
                                            name="rents.single.available"
                                            checked={formData.rents.single.available}
                                            onChange={handleInputChange}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span className="toggle-label">{formData.rents.single.available ? 'Available' : 'Unavailable'}</span>
                                    </label>
                                </div>
                                
                                {formData.rents.single.available && (
                                    <div className="rent-inputs-grid">
                                        <div className="listing-input-group">
                                            <label>Monthly Rent (₹)</label>
                                            <input
                                                type="number"
                                                name="rents.single.rent"
                                                value={formData.rents.single.rent}
                                                onChange={handleInputChange}
                                                placeholder="8000"
                                                min="0"
                                            />
                                        </div>
                                        <div className="listing-input-group">
                                            <label>Available Rooms</label>
                                            <input
                                                type="number"
                                                name="rents.single.count"
                                                value={formData.rents.single.count}
                                                onChange={handleInputChange}
                                                placeholder="5"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Double Room Card */}
                            <div className={`rent-card ${formData.rents.double.available ? 'available' : 'unavailable'}`}>
                                <div className="rent-card-header">
                                    <div className="rent-type-info">
                                        <span className="rent-icon">🛏️🛏️</span>
                                        <div>
                                            <h3>Double Sharing</h3>
                                            <p>Shared room for two people</p>
                                        </div>
                                    </div>
                                    <label className="modern-toggle">
                                        <input
                                            type="checkbox"
                                            name="rents.double.available"
                                            checked={formData.rents.double.available}
                                            onChange={handleInputChange}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span className="toggle-label">{formData.rents.double.available ? 'Available' : 'Unavailable'}</span>
                                    </label>
                                </div>
                                
                                {formData.rents.double.available && (
                                    <div className="rent-inputs-grid">
                                        <div className="listing-input-group">
                                            <label>Monthly Rent (₹)</label>
                                            <input
                                                type="number"
                                                name="rents.double.rent"
                                                value={formData.rents.double.rent}
                                                onChange={handleInputChange}
                                                placeholder="6000"
                                                min="0"
                                            />
                                        </div>
                                        <div className="listing-input-group">
                                            <label>Available Rooms</label>
                                            <input
                                                type="number"
                                                name="rents.double.count"
                                                value={formData.rents.double.count}
                                                onChange={handleInputChange}
                                                placeholder="10"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Triple Room Card */}
                            <div className={`rent-card ${formData.rents.triple.available ? 'available' : 'unavailable'}`}>
                                <div className="rent-card-header">
                                    <div className="rent-type-info">
                                        <span className="rent-icon">🛏️🛏️🛏️</span>
                                        <div>
                                            <h3>Triple Sharing</h3>
                                            <p>Shared room for three people</p>
                                        </div>
                                    </div>
                                    <label className="modern-toggle">
                                        <input
                                            type="checkbox"
                                            name="rents.triple.available"
                                            checked={formData.rents.triple.available}
                                            onChange={handleInputChange}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span className="toggle-label">{formData.rents.triple.available ? 'Available' : 'Unavailable'}</span>
                                    </label>
                                </div>
                                
                                {formData.rents.triple.available && (
                                    <div className="rent-inputs-grid">
                                        <div className="listing-input-group">
                                            <label>Monthly Rent (₹)</label>
                                            <input
                                                type="number"
                                                name="rents.triple.rent"
                                                value={formData.rents.triple.rent}
                                                onChange={handleInputChange}
                                                placeholder="5000"
                                                min="0"
                                            />
                                        </div>
                                        <div className="listing-input-group">
                                            <label>Available Rooms</label>
                                            <input
                                                type="number"
                                                name="rents.triple.count"
                                                value={formData.rents.triple.count}
                                                onChange={handleInputChange}
                                                placeholder="8"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

    // Remove image
    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // Show toast message
    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) newErrors.title = 'Property title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
        if (!formData.availableRooms || formData.availableRooms <= 0) newErrors.availableRooms = 'Number of rooms must be greater than 0';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            showToast('Please fix the errors before submitting', 'error');
            return;
        }

        setIsLoading(true);
        
        try {
            // Only send fields expected by backend
            const submitData = {
                title: formData.title,
                description: formData.description,
                address: formData.address,
                price: formData.price,
                images: images,
                availableRooms: formData.availableRooms,
                roomType: formData.roomType,
                amenities: formData.amenities,
                preferences: formData.preferences,
                rents: formData.rents,
                houseRules: formData.houseRules,
                whatsNearby: formData.whatsNearby,
                ownerName: formData.ownerName,
                ownerPhone: formData.ownerPhone,
                ownerEmail: formData.ownerEmail,
                propertyType: formData.propertyType,
                totalRooms: formData.totalRooms || 0,
                yearBuilt: formData.yearBuilt,
                furnished: !!formData.furnished
                // location: formData.location // add if you support location
            };

            // Create the listing using roomService
            const response = await roomService.createRoom(submitData);

            if (response.success) {
                showToast('Listing created successfully!', 'success');
                setTimeout(() => navigate('/owner-listings'), 2000);
            } else {
                showToast(response.message || 'Failed to create listing', 'error');
            }

        } catch (error) {
            console.error('Error creating listing:', error);
            showToast(error.message || 'Failed to create listing. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="add-listing-layout">
            <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
            
            <div className="add-listing-content" style={{ marginLeft: isSidebarCollapsed ? 80 : 256 }}>
                <div className="add-listing-container">
                    {/* Header */}
                    <div className="add-listing-header">
                        <div className="header-content">
                            <button className="back-btn" onClick={() => navigate('/owner-dashboard')}>
                                ← Back to Dashboard
                            </button>
                            <h1>Add New Listing</h1>
                            <p>Create a new property listing for students</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form className="add-listing-form" onSubmit={handleSubmit}>
                        {/* Basic Information */}
                        <div className="form-section">
                            <div className="section-header">
                                <h2>Basic Information</h2>
                                <p>Provide essential details about your property</p>
                            </div>
                            
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label htmlFor="title">Property Title *</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Elite Girls PG Near College"
                                        className={errors.title ? 'error' : ''}
                                    />
                                    {errors.title && <span className="error-text">{errors.title}</span>}
                                </div>
                                
                                <div className="form-group full-width">
                                    <label htmlFor="description">Description *</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe your property, its features, and what makes it special..."
                                        rows={4}
                                        className={errors.description ? 'error' : ''}
                                    />
                                    {errors.description && <span className="error-text">{errors.description}</span>}
                                </div>
                                
                                <div className="form-group full-width">
                                    <label htmlFor="address">Complete Address *</label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Street, Area, City, State, PIN Code"
                                        className={errors.address ? 'error' : ''}
                                    />
                                    {errors.address && <span className="error-text">{errors.address}</span>}
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="price">Monthly Rent (₹) *</label>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="15000"
                                        min="0"
                                        className={errors.price ? 'error' : ''}
                                    />
                                    {errors.price && <span className="error-text">{errors.price}</span>}
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="availableRooms">Available Rooms *</label>
                                    <input
                                        type="number"
                                        id="availableRooms"
                                        name="availableRooms"
                                        value={formData.availableRooms}
                                        onChange={handleInputChange}
                                        min="1"
                                        className={errors.availableRooms ? 'error' : ''}
                                    />
                                    {errors.availableRooms && <span className="error-text">{errors.availableRooms}</span>}
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="roomType">Room Type *</label>
                                    <select
                                        id="roomType"
                                        name="roomType"
                                        value={formData.roomType}
                                        onChange={handleInputChange}
                                    >
                                        {roomTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="form-section">
                            <div className="section-header">
                                <h2>🏠 Property Amenities</h2>
                                <p>Select all amenities available at your property to attract more tenants</p>
                            </div>
                            
                            <div className="amenities-grid-modern">
                                {amenitiesList.map(amenity => {
                                    const icons = {
                                        'Wi-Fi': '📶',
                                        'AC': '❄️',
                                        'Food': '🍽️',
                                        'Laundry': '🧺',
                                        'TV': '📺',
                                        'Gym': '🏋️',
                                        'Study Hall': '📚',
                                        'Parking': '🅿️',
                                        'Security': '🔒',
                                        'Housekeeping': '🧹',
                                        'Power Backup': '⚡',
                                        'Water Heater': '🚿'
                                    };
                                    
                                    return (
                                        <div
                                            key={amenity}
                                            className={`amenity-card ${formData.amenities.includes(amenity) ? 'selected' : ''}`}
                                            onClick={() => handleAmenityToggle(amenity)}
                                        >
                                            <div className="amenity-icon-modern">
                                                {icons[amenity] || '✨'}
                                            </div>
                                            <span className="amenity-text">{amenity}</span>
                                            <div className="amenity-check">
                                                {formData.amenities.includes(amenity) && <span>✅</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="selected-count">
                                <span className="count-badge">
                                    {formData.amenities.length} amenities selected
                                </span>
                            </div>
                        </div>

                        {/* House Rules */}
                        <div className="form-section">
                            <div className="section-header">
                                <h2>House Rules</h2>
                                <p>Specify any rules for tenants (optional)</p>
                            </div>
                            <textarea
                                name="houseRules"
                                value={formData.houseRules}
                                onChange={handleInputChange}
                                placeholder="e.g., No loud music after 10pm, No smoking inside rooms, etc."
                                rows={3}
                            />
                        </div>

                        {/* What's Nearby */}
                        <div className="form-section">
                            <div className="section-header">
                                <h2>What's Nearby</h2>
                                <p>Mention nearby landmarks, colleges, markets, etc. (optional)</p>
                            </div>
                            <textarea
                                name="whatsNearby"
                                value={formData.whatsNearby}
                                onChange={handleInputChange}
                                placeholder="e.g., 5 mins from Metro, Near ABC College, Supermarket next door, etc."
                                rows={2}
                            />
                        </div>

                        {/* Owner/Property Details */}
                        <div className="form-section">
                            <div className="section-header">
                                <h2>Owner & Property Details</h2>
                                <p>Provide details for better trust and transparency (optional)</p>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="ownerName">Owner Name</label>
                                    <input
                                        type="text"
                                        id="ownerName"
                                        name="ownerName"
                                        value={formData.ownerName}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Rajesh Kumar"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="ownerPhone">Owner Phone</label>
                                    <input
                                        type="text"
                                        id="ownerPhone"
                                        name="ownerPhone"
                                        value={formData.ownerPhone}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 9876543210"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="ownerEmail">Owner Email</label>
                                    <input
                                        type="email"
                                        id="ownerEmail"
                                        name="ownerEmail"
                                        value={formData.ownerEmail}
                                        onChange={handleInputChange}
                                        placeholder="e.g., owner@email.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="propertyType">Property Type</label>
                                    <input
                                        type="text"
                                        id="propertyType"
                                        name="propertyType"
                                        value={formData.propertyType}
                                        onChange={handleInputChange}
                                        placeholder="e.g., PG, Hostel, Apartment"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="totalRooms">Total Rooms</label>
                                    <input
                                        type="number"
                                        id="totalRooms"
                                        name="totalRooms"
                                        value={formData.totalRooms}
                                        onChange={handleInputChange}
                                        min="1"
                                        placeholder="e.g., 20"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="yearBuilt">Year Built</label>
                                    <input
                                        type="text"
                                        id="yearBuilt"
                                        name="yearBuilt"
                                        value={formData.yearBuilt}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 2018"
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <span style={{ fontWeight: 500, marginRight: 8 }}>Furnished</span>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, marginRight: 12 }}>
                                        <input
                                            type="radio"
                                            id="furnished-yes"
                                            name="furnished"
                                            checked={formData.furnished === true}
                                            onChange={() => setFormData(prev => ({ ...prev, furnished: true }))}
                                            style={{ width: 16, height: 16, accentColor: '#3b82f6', borderRadius: 4, cursor: 'pointer' }}
                                        />
                                        Yes
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
                                        <input
                                            type="radio"
                                            id="furnished-no"
                                            name="furnished"
                                            checked={formData.furnished === false}
                                            onChange={() => setFormData(prev => ({ ...prev, furnished: false }))}
                                            style={{ width: 16, height: 16, accentColor: '#ef4444', borderRadius: 4, cursor: 'pointer' }}
                                        />
                                        No
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="form-section">
                            <div className="section-header">
                                <h2>Preferences</h2>
                                <p>Set your preferred tenant requirements</p>
                            </div>
                            
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="gender">Gender Preference</label>
                                    <select
                                        id="gender"
                                        name="preferences.gender"
                                        value={formData.preferences.gender}
                                        onChange={handleInputChange}
                                    >
                                        <option value="any">Any</option>
                                        <option value="male">Male Only</option>
                                        <option value="female">Female Only</option>
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="foodPreferences">Food Preference</label>
                                    <select
                                        id="foodPreferences"
                                        name="preferences.foodPreferences"
                                        value={formData.preferences.foodPreferences}
                                        onChange={handleInputChange}
                                    >
                                        <option value="any">Any</option>
                                        <option value="veg">Vegetarian Only</option>
                                        <option value="non-veg">Non-Vegetarian</option>
                                    </select>
                                </div>
                                

                            </div>
                        </div>

                        {/* Images */}
                        <div className="form-section">
                            <div className="section-header">
                                <h2>Property Images</h2>
                                <p>Upload clear photos of your property (Max 6 images, 5MB each)</p>
                            </div>
                            
                            <div className="image-upload-section">
                                <div className="image-upload-area">
                                    <input
                                        type="file"
                                        id="images"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="images" className="upload-label">
                                        <div className="upload-icon">📷</div>
                                        <p>Click to upload images</p>
                                        <span>or drag and drop</span>
                                    </label>
                                </div>
                                
                                {images.length > 0 && (
                                    <div className="uploaded-images">
                                        {images.map((image, index) => (
                                            <div key={index} className="image-preview">
                                                <img
                                                    src={URL.createObjectURL(image)}
                                                    alt={`Upload ${index + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    className="remove-image"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="form-progress">
                            <div className="progress-header">
                                <h3>✅ Form Progress</h3>
                                <span className="progress-percentage">{Math.round(((formData.title ? 1 : 0) + (formData.description ? 1 : 0) + (formData.address ? 1 : 0) + (formData.price ? 1 : 0) + (formData.amenities.length > 0 ? 1 : 0) + (Object.values(formData.rents).some(r => r.available) ? 1 : 0)) / 6 * 100)}% Complete</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{width: `${Math.round(((formData.title ? 1 : 0) + (formData.description ? 1 : 0) + (formData.address ? 1 : 0) + (formData.price ? 1 : 0) + (formData.amenities.length > 0 ? 1 : 0) + (Object.values(formData.rents).some(r => r.available) ? 1 : 0)) / 6 * 100)}%`}}></div>
                            </div>
                            <div className="progress-checklist">
                                <div className={`progress-item ${formData.title ? 'completed' : ''}`}>
                                    <span className="check-icon">{formData.title ? '✅' : '⏳'}</span>
                                    Property Title
                                </div>
                                <div className={`progress-item ${formData.description ? 'completed' : ''}`}>
                                    <span className="check-icon">{formData.description ? '✅' : '⏳'}</span>
                                    Description
                                </div>
                                <div className={`progress-item ${formData.address ? 'completed' : ''}`}>
                                    <span className="check-icon">{formData.address ? '✅' : '⏳'}</span>
                                    Address
                                </div>
                                <div className={`progress-item ${formData.price ? 'completed' : ''}`}>
                                    <span className="check-icon">{formData.price ? '✅' : '⏳'}</span>
                                    Pricing
                                </div>
                                <div className={`progress-item ${formData.amenities.length > 0 ? 'completed' : ''}`}>
                                    <span className="check-icon">{formData.amenities.length > 0 ? '✅' : '⏳'}</span>
                                    Amenities
                                </div>
                                <div className={`progress-item ${Object.values(formData.rents).some(r => r.available) ? 'completed' : ''}`}>
                                    <span className="check-icon">{Object.values(formData.rents).some(r => r.available) ? '✅' : '⏳'}</span>
                                    Room Configuration
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Submit Actions */}
                        <div className="form-actions">
                            <div className="actions-left">
                                <button
                                    type="button"
                                    className="btn-ghost"
                                    onClick={() => navigate('/owner-dashboard')}
                                    disabled={isLoading}
                                >
                                    <span className="btn-icon">←</span>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={() => {
                                        localStorage.setItem('listingDraft', JSON.stringify(formData));
                                        showToast('Draft saved successfully!', 'success');
                                    }}
                                    disabled={isLoading}
                                >
                                    <span className="btn-icon">💾</span>
                                    Save Draft
                                </button>
                            </div>
                            <div className="actions-right">
                                <button
                                    type="submit"
                                    className="btn-primary-large"
                                    disabled={isLoading || !formData.title || !formData.description || !formData.address}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading-spinner"></span>
                                            Creating Listing...
                                        </>
                                    ) : (
                                        <>
                                            <span className="btn-icon">🚀</span>
                                            Publish Listing
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
                
                <Footer />
            </div>
            
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: '', type: '' })}
                />
            )}
        </div>
    );
};

export default AddNewListing;