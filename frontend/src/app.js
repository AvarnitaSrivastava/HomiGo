import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import MatchCard from './components/MatchCard';
import Matches from './components/Matches';
import ListingsPage from './pages/ListingsPage';
import HostelDetail from './pages/HostelDetail';
import StudentHostelDetail from './pages/StudentHostelDetail';
import OwnerHostelDetail from './pages/OwnerHostelDetail';

// Owner-specific components
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerProfile from './pages/OwnerProfile';
import OwnerListingManagement from './pages/OwnerListingManagement';
import AddNewListing from './pages/AddNewListing';
import Settings from './pages/Settings';

import './styles/global.css';




function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Student Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/MatchCard" element={<MatchCard />} />
            <Route path="/profile" element={<Profile />} />

            {/* Owner-specific Routes */}
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/owner-profile" element={<OwnerProfile />} />
            <Route path="/owner-listings" element={<OwnerListingManagement />} />
            <Route path="/add-listing" element={<AddNewListing />} />
            <Route path="/settings" element={<Settings />} />


            <Route path="/hostels" element={<ListingsPage />} />
            <Route path="/hostel/:id" element={<StudentHostelDetail />} />
            <Route path="/owner/hostel/:id" element={<OwnerHostelDetail />} />
          </Routes>
        </div>
      </Router>
  );
};

      export default App;
