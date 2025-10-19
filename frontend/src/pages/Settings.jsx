import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileMenu from '../components/MobileMenu';
import authService from '../services/authService';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      setDeleteError('');
      
      const response = await authService.deleteAccount();
      if (response.success) {
        // Log out and redirect to home page
        await authService.logout();
        navigate('/');
      } else {
        setDeleteError(response.message || 'Failed to delete account');
      }
    } catch (error) {
      setDeleteError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDeleteConfirmation = () => (
    <div className="delete-confirmation-overlay">
      <div className="delete-confirmation-modal">
        <h3>Delete Account</h3>
        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
        {deleteError && <div className="error-message">{deleteError}</div>}
        <div className="confirmation-buttons">
          <button 
            className="cancel-button"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="delete-button"
            onClick={handleDeleteAccount}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Yes, Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="settings-content">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account settings and preferences</p>
        </div>

        <div className="settings-nav">
          <button 
            className={`nav-button ${activeSection === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSection('general')}
          >
            General
          </button>
          <button 
            className={`nav-button ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            Notifications
          </button>
          <button 
            className={`nav-button ${activeSection === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveSection('privacy')}
          >
            Privacy
          </button>
          <button 
            className={`nav-button ${activeSection === 'account' ? 'active' : ''}`}
            onClick={() => setActiveSection('account')}
          >
            Account
          </button>
        </div>

        <div className="settings-body">
          {activeSection === 'general' && (
            <div className="settings-section">
              <h2>General Settings</h2>
              <div className="settings-group">
                <h3>App Preferences</h3>
                <div className="settings-row">
                  <div className="settings-label">
                    <span>Language</span>
                    <span className="settings-description">Choose your preferred language</span>
                  </div>
                  <select className="settings-select">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div className="settings-row">
                  <div className="settings-label">
                    <span>Time Zone</span>
                    <span className="settings-description">Set your local time zone</span>
                  </div>
                  <select className="settings-select">
                    <option value="UTC">UTC</option>
                    <option value="IST">IST (UTC+5:30)</option>
                    <option value="PST">PST (UTC-8)</option>
                    <option value="EST">EST (UTC-5)</option>
                  </select>
                </div>
                <div className="settings-row">
                  <div className="settings-label">
                    <span>Theme</span>
                    <span className="settings-description">Choose your preferred appearance</span>
                  </div>
                  <select className="settings-select">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Currency & Region</h3>
                <div className="settings-row">
                  <div className="settings-label">
                    <span>Currency</span>
                    <span className="settings-description">Set your preferred currency for rent and payments</span>
                  </div>
                  <select className="settings-select">
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>
                <div className="settings-row">
                  <div className="settings-label">
                    <span>Distance Unit</span>
                    <span className="settings-description">Choose how distances are displayed</span>
                  </div>
                  <select className="settings-select">
                    <option value="km">Kilometers</option>
                    <option value="mi">Miles</option>
                  </select>
                </div>
              </div>

              <div className="settings-group">
                <h3>Accessibility</h3>
                <div className="settings-row">
                  <div className="settings-label">
                    <span>Font Size</span>
                    <span className="settings-description">Adjust the text size</span>
                  </div>
                  <select className="settings-select">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Reduce Motion</span>
                    <span className="settings-description">Minimize animations</span>
                  </div>
                  <input type="checkbox" />
                </label>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>High Contrast</span>
                    <span className="settings-description">Increase text contrast</span>
                  </div>
                  <input type="checkbox" />
                </label>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              
              <div className="settings-group">
                <h3>Email Notifications</h3>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>New Messages</span>
                    <span className="settings-description">Get notified when you receive new messages</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Connection Requests</span>
                    <span className="settings-description">Get notified about new roommate connection requests</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>New Listings</span>
                    <span className="settings-description">Get notified about new listings matching your preferences</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
              </div>

              <div className="settings-group">
                <h3>Push Notifications</h3>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Instant Messages</span>
                    <span className="settings-description">Receive real-time notifications for messages</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Listing Updates</span>
                    <span className="settings-description">Get notified when saved listings are updated</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Match Alerts</span>
                    <span className="settings-description">Get notified about new potential matches</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
              </div>

              <div className="settings-group">
                <h3>Communication Preferences</h3>
                <div className="settings-row">
                  <div className="settings-label">
                    <span>Email Digest</span>
                    <span className="settings-description">Frequency of summary emails</span>
                  </div>
                  <select className="settings-select">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                <div className="settings-row">
                  <div className="settings-label">
                    <span>Quiet Hours</span>
                    <span className="settings-description">Don't send notifications during these hours</span>
                  </div>
                  <div className="time-range-inputs">
                    <input type="time" defaultValue="22:00" className="settings-input" />
                    <span>to</span>
                    <input type="time" defaultValue="08:00" className="settings-input" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="settings-section">
              <h2>Privacy Settings</h2>
              
              <div className="settings-group">
                <h3>Profile Visibility</h3>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Public Profile</span>
                    <span className="settings-description">Allow your profile to be discoverable by other users</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Show Contact Info</span>
                    <span className="settings-description">Display your contact information to connected users</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Share Location</span>
                    <span className="settings-description">Show your general location on your profile</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
              </div>

              <div className="settings-group">
                <h3>Communication Privacy</h3>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Direct Messages</span>
                    <span className="settings-description">Allow messages from non-connections</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
                <div className="settings-row">
                  <div className="settings-label">
                    <span>Message Requests</span>
                    <span className="settings-description">Who can send you message requests</span>
                  </div>
                  <select className="settings-select">
                    <option value="everyone">Everyone</option>
                    <option value="connections">Connections Only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
              </div>

              <div className="settings-group">
                <h3>Data & Privacy</h3>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Activity Status</span>
                    <span className="settings-description">Show when you're active on HomiGo</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
                <label className="settings-checkbox-row">
                  <div className="settings-label">
                    <span>Personalized Recommendations</span>
                    <span className="settings-description">Use your data to improve listing recommendations</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </label>
                <div className="settings-action-button">
                  <button className="secondary-button">
                    Download My Data
                  </button>
                </div>
              </div>

              <div className="settings-group">
                <h3>Blocking & Restrictions</h3>
                <div className="settings-action-button">
                  <button className="secondary-button">
                    Manage Blocked Users
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="settings-section">
              <h2>Account Management</h2>
              <div className="settings-group">
                <h3>Account Status</h3>
                <p className="status-active">Active</p>
              </div>
              <div className="settings-group danger-zone">
                <h3>Danger Zone</h3>
                <p>Once you delete your account, there is no going back. Please be certain.</p>
                <button 
                  className="delete-account-button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && renderDeleteConfirmation()}
    </div>
  );
};

export default Settings;