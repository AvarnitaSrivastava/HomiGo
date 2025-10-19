import React from 'react';
import './RoomCard.css';

const RoomCard = ({ room }) => {
  const handleViewDetails = () => {
    
    // Handle view details logic here
  };

  const handleContact = () => {
    
    // Handle contact logic here
  };

  return (
    <div className="room-card">
      <div className="room-image">
        <img src={room.image} alt={room.title} />
        <div className={`availability-badge ${room.available ? 'available' : 'unavailable'}`}>
          {room.available ? 'Available' : 'Unavailable'}
        </div>
      </div>
      
      <div className="room-info">
        <h3>{room.title}</h3>
        <p className="room-price">{room.price}</p>
        <p className="room-location">📍 {room.location}</p>
        <p className="room-description">{room.description}</p>
      </div>
      
      <div className="room-actions">
        <button className="view-details-btn" onClick={handleViewDetails}>
          View Details
        </button>
        <button className="contact-btn" onClick={handleContact}>
          Contact
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
