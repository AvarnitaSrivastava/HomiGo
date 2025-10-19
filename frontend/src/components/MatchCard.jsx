import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/matches.css';

const MatchCard = ({ match, onRequest, onReject, onCancelRequest }) => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const handleRequest = () => {
    if (match.requestSent) return;
    
    setIsAnimating(true);
    timeoutRef.current = setTimeout(() => {
      onRequest(match._id || match.id, match.name);
      setIsAnimating(false);
    }, 300);
  };

  const handleReject = () => {
    setIsAnimating(true);
    timeoutRef.current = setTimeout(() => {
      onReject(match._id || match.id, match.name);
      setIsAnimating(false);
    }, 300);
  };

  const handleCancelRequest = () => {
    setIsAnimating(true);
    timeoutRef.current = setTimeout(() => {
      onCancelRequest(match._id || match.id, match.name);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className={`match-card ${isAnimating ? 'animating' : ''}`}>
      {/* Profile Image with overlay content */}
      <div className="profile-image-contain">
        <img 
          src={match.profileImage} 
          alt={`${match.name}'s profile`}
          className="profile-image"
          onError={(e) => {
            e.target.src = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1';
          }}
        />
        
        {/* Compatibility Badge */}
          <div className={`compatibility-badge ${
            match.compatibility >= 90 ? 'perfect-match' :
            match.compatibility >= 75 ? 'high-match' :
            match.compatibility >= 50 ? 'moderate-match' :
            'low-match'
          }`}>
            {match.compatibility}%
          </div>
        
        {/* Verified Badge */}
        {match.verified && (
          <div className="verify-badge">✓</div>
        )}
        
        {/* Gradient Overlay */}
        <div className="card-overlay"></div>
        
        {/* Profile Info Overlay */}
        <div className="profile-info-overlay">
          <h3 className="profile-name">
            {match.name}
          </h3>
          <p className="profile-details">
            <span className="profile-location">📍 {match.location}</span>
            <span className="profile-course">🎓 {match.course}</span>
            <span className="profile-lifestyle">
              {match.lifestyle?.smoking === 'no' && '🚭 '}
              {match.lifestyle?.cleanliness === 'neat' && '✨ '}
              {match.lifestyle?.studyHabits === 'group' && '👥 '}
              {match.lifestyle?.social === 'extrovert' && '🎉 '}
            </span>
          </p>
          
          {/* Interests */}
          <div className="interests">
            {(match.interests || []).slice(0, 2).map((interest) => (
              <span key={interest} className="interest-tag">
                {interest}
              </span>
            ))}
            {Array.isArray(match.interests) && match.interests.length > 2 && (
              <span className="interest-more">
                +{match.interests.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="match-actions">
        {match.requestSent ? (
          <>
            <button className="request-sent-btn">
              <span>✅ Sent</span>
            </button>
            <button 
              className="cancel-request-btn"
              onClick={handleCancelRequest}
              title="Cancel request"
            >
              <span>↶ Cancel</span>
            </button>
          </>
        ) : match.connected ? (
          <button 
            className="message-match-btn connected-message-btn"
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
            title="Start messaging"
          >
            💬 Message
          </button>
        ) : (
          <>
            <button 
              className="reject-btn"
              onClick={handleReject}
              title="Pass"
            >
              ✕
            </button>
            <button 
              className="request-btn"
              onClick={handleRequest}
              title="Like"
            >
              ♥
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
