const { Listing } = require("../models/listing.model");
const Owner = require("../models/owner.model");
const cloudinary = require("../utils/cloudinary");

// Get listings for the logged-in owner
const getMyListings = async (req, res) => {
  try {
    // Debug log the entire request user object
    console.log('👤 Request user object:', JSON.stringify(req.user, null, 2));

    if (!req.user || !req.user._id) {
      console.log('❌ No authenticated user found');
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Verify owner status
    try {
      const owner = await Owner.findById(req.user._id)
        .select('-password -refreshToken')
        .lean();

      if (!owner) {
        console.log('❌ User is not an owner:', req.user._id);
        return res.status(403).json({
          success: false,
          error: 'Access restricted to owners only'
        });
      }

      console.log('✅ Owner verified:', owner._id);

      // Find all listings for this owner
      const listings = await Listing.find({ 
        owner: owner._id 
      })
      .select('-__v')
      .lean();

      console.log(`✅ Found ${listings.length} listings for owner:`, owner._id);

      return res.status(200).json({
        success: true,
        data: listings
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database error while fetching owner data',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (error) {
    console.error('❌ Error in getMyListings:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while processing request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get room details
const getRoomDetails = async (req, res) => {
  // ... rest of the controller methods
};

module.exports = {
  getMyListings,
  getRoomDetails,
  // ... other exports
};