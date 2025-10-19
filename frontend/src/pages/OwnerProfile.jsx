import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MobileMenu from '../components/MobileMenu';
import './Profile.css';
import '../styles/ownerProfile.custom.css';
import authService from '../services/authService';

const defaultOwnerProfile = {
  fullname: '',
  email: '',
  phone: '',
  organization: '',
  avatar: '',
  amenities: [],
  houseRules: '',
  profileDescription: '',
  socialLinks: {
    linkedin: '',
    facebook: '',
    instagram: ''
  },
  businessDetails: {
    establishedYear: '',
    totalProperties: 0,
    businessLicense: '',
    gstNumber: '',
    businessAddress: '',
    operatingHours: {
      from: '09:00',
      to: '18:00'
    }
  },
  contactInfo: {
    alternatePhone: '',
    whatsapp: '',
    landline: '',
    website: ''
  },
  bankDetails: {
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: ''
  },
  preferences: {
    preferredTenants: 'any', // 'students', 'working_professionals', 'any'
    minStayDuration: '1', // months
    securityDeposit: 'standard',
    paymentTerms: 'monthly'
  },
  verified: false,
  businessRating: 0
};

const OwnerProfile = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [isEditing, setIsEditing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(defaultOwnerProfile);
  // Profile completion calculation
  const getProfileCompletion = () => {
    let filled = 0;
    let total = 10;
    if (ownerProfile.fullname) filled++;
    if (ownerProfile.email) filled++;
    if (ownerProfile.phone) filled++;
    if (ownerProfile.organization) filled++;
    if (ownerProfile.profileDescription) filled++;
    if ((ownerProfile.amenities || []).length > 0) filled++;
    if (ownerProfile.houseRules) filled++;
    if (ownerProfile.businessDetails.businessAddress) filled++;
    if (ownerProfile.businessDetails.businessLicense) filled++;
    if (ownerProfile.socialLinks && (ownerProfile.socialLinks.linkedin || ownerProfile.socialLinks.facebook || ownerProfile.socialLinks.instagram)) filled++;
    return Math.round((filled / total) * 100);
  };
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchOwnerProfile = async () => {
      try {
        setIsLoading(true);
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setOwnerProfile(prev => ({
            ...prev,
            ...response.data,
            businessDetails: {
              ...prev.businessDetails,
              ...response.data.businessDetails
            },
            contactInfo: {
              ...prev.contactInfo,
              ...response.data.contactInfo
            }
          }));
        } else {
          setError(response.message || 'Failed to fetch user data');
        }
      } catch (err) {
        setError('Failed to load owner profile');
        console.error('Error fetching owner profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOwnerProfile();
  }, []);

  const handleInputChange = (section, field, value) => {
  // Social links
  const handleSocialLinkChange = (platform, value) => {
    setOwnerProfile(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };
    if (section) {
      setOwnerProfile(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setOwnerProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // For amenities (array of strings)
  const handleAmenitiesChange = (index, value) => {
    setOwnerProfile(prev => {
      const newAmenities = [...(prev.amenities || [])];
      newAmenities[index] = value;
      return { ...prev, amenities: newAmenities };
    });
  };
  const handleAddAmenity = () => {
    setOwnerProfile(prev => ({ ...prev, amenities: [...(prev.amenities || []), ''] }));
  };
  const handleRemoveAmenity = (index) => {
    setOwnerProfile(prev => {
      const newAmenities = [...(prev.amenities || [])];
      newAmenities.splice(index, 1);
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
  // TODO: Implement API call to update owner profile
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
  { id: 'business', label: 'Business Info', icon: '🏢' },
  { id: 'contact', label: 'Contact Details', icon: '📞' },
  { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];

  // Add a summary card for verification and rating
  const summaryCard = (
    <>
      <div className="owner-summary-card">
        <div className="avatar-section">
          <img
            src={ownerProfile.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ownerProfile.fullname)}
            alt="Owner Avatar"
            className="owner-avatar"
          />
          <div className="owner-name-email">
            <h2>{ownerProfile.fullname}</h2>
            <p>{ownerProfile.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1, gap: 8 }}>
          <span className={`verified-badge ${ownerProfile.verified ? 'verified' : ''}`}>{ownerProfile.verified ? 'Verified' : 'Unverified'}</span>
          <span className="business-rating">⭐ {ownerProfile.businessRating || 0}</span>
          <button
            className="edit-profile-btn"
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? (isSaving ? 'Saving...' : 'Save') : 'Edit Profile'}
          </button>
          
        </div>
      </div>
      {/* Profile Completion Bar below the card */}
      <div className="profile-completion-bar" style={{ marginTop: 16, marginBottom: 8 }}>
        <div style={{ fontSize: 13, marginBottom: 4 }}>Profile Completion: {getProfileCompletion()}%</div>
        <div style={{ background: '#eee', borderRadius: 8, height: 8, width: '100%' }}>
          <div style={{ background: '#6c63ff', width: `${getProfileCompletion()}%`, height: 8, borderRadius: 8 }}></div>
        </div>
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading owner profile...</p>
      </div>
    );
  }

  return (
    <div className="owner-profile-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f7f7fa' }}>
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="profile-main-content" style={{ flex: 1, marginLeft: 256, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1, padding: '32px 32px 0 32px' }}>
          {/* Personalized Welcome */}
          <h1>Welcome, {ownerProfile.fullname || 'Owner'}!</h1>
          {/* Summary Card */}
          {summaryCard}
          {/* Tabs */}
          <div className="profile-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          <div className="tab-content">
            {/* Business Info Tab */}
            {activeTab === 'business' && (
              <div className="owner-profile-section-card">
                <h2><span className="section-icon">🏢</span>Business Information</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name*</label>
                    <input
                      type="text"
                      value={ownerProfile.fullname}
                      onChange={(e) => handleInputChange(null, 'fullname', e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Organization/Business Name*</label>
                    <input
                      type="text"
                      value={ownerProfile.organization}
                      onChange={(e) => handleInputChange(null, 'organization', e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Established Year</label>
                    <input
                      type="number"
                      value={ownerProfile.businessDetails.establishedYear}
                      onChange={(e) => handleInputChange('businessDetails', 'establishedYear', e.target.value)}
                      disabled={!isEditing}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Properties</label>
                    <input
                      type="number"
                      value={ownerProfile.businessDetails.totalProperties}
                      onChange={(e) => handleInputChange('businessDetails', 'totalProperties', parseInt(e.target.value))}
                      disabled={!isEditing}
                      min="0"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Business Address</label>
                    <textarea
                      value={ownerProfile.businessDetails.businessAddress}
                      onChange={(e) => handleInputChange('businessDetails', 'businessAddress', e.target.value)}
                      disabled={!isEditing}
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Business License Number</label>
                    <input
                      type="text"
                      value={ownerProfile.businessDetails.businessLicense}
                      onChange={(e) => handleInputChange('businessDetails', 'businessLicense', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>GST Number</label>
                    <input
                      type="text"
                      value={ownerProfile.businessDetails.gstNumber}
                      onChange={(e) => handleInputChange('businessDetails', 'gstNumber', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Operating Hours (From)</label>
                    <input
                      type="time"
                      value={ownerProfile.businessDetails.operatingHours.from}
                      onChange={(e) => handleInputChange('businessDetails', 'operatingHours', {
                        ...ownerProfile.businessDetails.operatingHours,
                        from: e.target.value
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Operating Hours (To)</label>
                    <input
                      type="time"
                      value={ownerProfile.businessDetails.operatingHours.to}
                      onChange={(e) => handleInputChange('businessDetails', 'operatingHours', {
                        ...ownerProfile.businessDetails.operatingHours,
                        to: e.target.value
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Details Tab */}
            {activeTab === 'contact' && (
              <div className="owner-profile-section-card">
                <h2><span className="section-icon">📞</span>Contact Information</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Primary Email*</label>
                    <input
                      type="email"
                      value={ownerProfile.email}
                      onChange={(e) => handleInputChange(null, 'email', e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Primary Phone*</label>
                    <input
                      type="tel"
                      value={ownerProfile.phone}
                      onChange={(e) => handleInputChange(null, 'phone', e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Alternate Phone</label>
                    <input
                      type="tel"
                      value={ownerProfile.contactInfo.alternatePhone}
                      onChange={(e) => handleInputChange('contactInfo', 'alternatePhone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp Number</label>
                    <input
                      type="tel"
                      value={ownerProfile.contactInfo.whatsapp}
                      onChange={(e) => handleInputChange('contactInfo', 'whatsapp', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Landline</label>
                    <input
                      type="tel"
                      value={ownerProfile.contactInfo.landline}
                      onChange={(e) => handleInputChange('contactInfo', 'landline', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="url"
                      value={ownerProfile.contactInfo.website}
                      onChange={(e) => handleInputChange('contactInfo', 'website', e.target.value)}
                      disabled={!isEditing}
                      placeholder="https://your-website.com"
                    />
                  </div>
                </div>
              </div>
            )}

            

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="owner-profile-section-card">
                <h2><span className="section-icon">⚙️</span>Business Preferences</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Preferred Tenants</label>
                    <select
                      value={ownerProfile.preferences.preferredTenants}
                      onChange={(e) => handleInputChange('preferences', 'preferredTenants', e.target.value)}
                      disabled={!isEditing}
                    >
                      <option value="any">Any</option>
                      <option value="students">Students Only</option>
                      <option value="working_professionals">Working Professionals Only</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Minimum Stay Duration (months)</label>
                    <select
                      value={ownerProfile.preferences.minStayDuration}
                      onChange={(e) => handleInputChange('preferences', 'minStayDuration', e.target.value)}
                      disabled={!isEditing}
                    >
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Security Deposit Policy</label>
                    <select
                      value={ownerProfile.preferences.securityDeposit}
                      onChange={(e) => handleInputChange('preferences', 'securityDeposit', e.target.value)}
                      disabled={!isEditing}
                    >
                      <option value="standard">1 Month Rent</option>
                      <option value="double">2 Months Rent</option>
                      <option value="custom">Custom Amount</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Payment Terms</label>
                    <select
                      value={ownerProfile.preferences.paymentTerms}
                      onChange={(e) => handleInputChange('preferences', 'paymentTerms', e.target.value)}
                      disabled={!isEditing}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="biannual">Bi-Annual</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>

                  

                  {/* House Rules */}
                  <div className="form-group full-width">
                    <label>House Rules</label>
                    <textarea
                      value={ownerProfile.houseRules || ''}
                      onChange={e => handleInputChange(null, 'houseRules', e.target.value)}
                      disabled={!isEditing}
                      rows="3"
                      placeholder="Enter house rules here..."
                    />
                  </div>

                  {/* Amenities */}
                  <div className="form-group full-width">
                    <label>Amenities</label>
                    {(ownerProfile.amenities || []).map((amenity, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <input
                          type="text"
                          value={amenity}
                          onChange={e => handleAmenitiesChange(idx, e.target.value)}
                          disabled={!isEditing}
                          style={{ flex: 1, marginRight: 8 }}
                        />
                        {isEditing && (
                          <button type="button" onClick={() => handleRemoveAmenity(idx)} style={{ color: 'red' }}>Remove</button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button type="button" onClick={handleAddAmenity} style={{ marginTop: 8 }}>Add Amenity</button>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="form-group full-width">
                    <label>Social Links</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        type="url"
                        placeholder="LinkedIn URL"
                        value={ownerProfile.socialLinks?.linkedin || ''}
                        onChange={e => handleSocialLinkChange('linkedin', e.target.value)}
                        disabled={!isEditing}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="url"
                        placeholder="Facebook URL"
                        value={ownerProfile.socialLinks?.facebook || ''}
                        onChange={e => handleSocialLinkChange('facebook', e.target.value)}
                        disabled={!isEditing}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="url"
                        placeholder="Instagram URL"
                        value={ownerProfile.socialLinks?.instagram || ''}
                        onChange={e => handleSocialLinkChange('instagram', e.target.value)}
                        disabled={!isEditing}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen}
      />
    </div>
  );
};

export default OwnerProfile;