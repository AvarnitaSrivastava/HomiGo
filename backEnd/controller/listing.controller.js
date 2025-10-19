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
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No authenticated user found, returning empty listings.'
      });
    }

    let owner;
    try {
      owner = await Owner.findById(req.user._id)
        .select('-password -refreshToken')
        .lean();
    } catch (dbErr) {
      console.error('❌ DB error when finding owner:', dbErr);
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Database error when finding owner, returning empty listings.'
      });
    }

    if (!owner) {
      console.log('❌ User is not an owner:', req.user._id);
      return res.status(200).json({
        success: true,
        data: [],
        message: 'User is not an owner, returning empty listings.'
      });
    }

    console.log('✅ Owner verified:', owner._id);

    let listings = [];
    try {
      listings = await Listing.find({ owner: owner._id })
        .select('-__v')
        .lean();
    } catch (dbErr) {
      console.error('❌ DB error when finding listings:', dbErr);
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Database error when finding listings, returning empty listings.'
      });
    }

    console.log(`✅ Found ${listings.length} listings for owner:`, owner._id);

    return res.status(200).json({
      success: true,
      data: listings || []
    });
  } catch (error) {
    console.error('❌ Error in getMyListings (outer catch):', error);
    if (error && error.stack) {
      console.error('❌ Error stack:', error.stack);
    }
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Internal error, returning empty listings.',
      error: error && error.message ? error.message : error
    });
  }
};

// Get all rooms with filters
const getRooms = async (req, res) => {
  try {
    const { minPrice, maxPrice, amenities, preferences, location } = req.query;
    let query = {};

    // Build filter query
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (amenities) {
      query.amenities = { $all: amenities.split(',') };
    }

    if (preferences) {
      const prefObj = JSON.parse(preferences);
      Object.keys(prefObj).forEach(key => {
        query[`preferences.${key}`] = prefObj[key];
      });
    }

    if (location) {
      // Assuming location is sent as "lat,lng"
      const [lat, lng] = location.split(',').map(Number);
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: 10000 // 10km radius
        }
      };
    }

    const rooms = await Listing.find(query).populate("owner", "fullname email phone profilePicture");
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get room details
const getRoomDetails = async (req, res) => {
  try {
    const room = await Listing.findById(req.params.id).populate("owner", "fullname email phone profilePicture");
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    // Debug: log the rents field
    console.log('[getRoomDetails] rents field:', JSON.stringify(room.rents, null, 2));
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const createRoom = async (req, res) => {
  try {
    // Because we receive multipart/form-data, nested fields might arrive as JSON strings.
    // Parse safely with fallbacks so empty fields are still stored with defaults from schema.
    const body = req.body || {};
    const parseMaybeJSON = (val) => {
      if (val == null) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    };

  // availableRoomsByType removed

    const title = body.title;
    const description = body.description;
    const address = body.address;
    const price = body.price;
    const availableRooms = body.availableRooms;
    const roomType = body.roomType;
    const amenities = parseMaybeJSON(body.amenities) || [];
    const preferences = parseMaybeJSON(body.preferences) || {};
    const location = parseMaybeJSON(body.location);
    const rents = parseMaybeJSON(body.rents) || {};
    const houseRules = body.houseRules ?? '';
    const whatsNearby = body.whatsNearby ?? '';
    const ownerName = body.ownerName ?? '';
    const ownerPhone = body.ownerPhone ?? '';
    const ownerEmail = body.ownerEmail ?? '';
    const propertyType = body.propertyType ?? '';
    const totalRooms = body.totalRooms ?? 0;
    const yearBuilt = body.yearBuilt ?? '';
    const furnished = body.furnished === 'true' || body.furnished === true ? true : false;

    if (!title || !description || !address || !price || !roomType) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    // Handle image upload
    let images = [];
    if (req.files && req.files.images) {
      const uploadedImages = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      
      for (const image of uploadedImages) {
        const result = await cloudinary.uploader.upload(image.tempFilePath, {
          folder: "rooms",
          width: 1200,
          crop: "scale"
        });
        images.push(result.secure_url);
      }
    }

    const room = await Listing.create({
      owner: req.user._id,
      title,
      description,
      address,
      price,
      images,
      availableRooms,
      roomType,
      amenities,
      preferences,
      location,
      rents,
      houseRules,
      whatsNearby,
      ownerName,
      ownerPhone,
      ownerEmail,
      propertyType,
      totalRooms,
      yearBuilt,
      furnished
    });

    res.status(201).json({ success: true, message: "Room created successfully", data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update room
const updateRoom = async (req, res) => {
  // availableRoomsByType removed
  try {
    const body = req.body || {};
    const parseMaybeJSON = (val) => {
      if (val == null) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    };

    const title = body.title;
    const description = body.description;
    const address = body.address;
    const price = body.price;
    const availableRooms = body.availableRooms;
    const roomType = body.roomType;
    const amenities = parseMaybeJSON(body.amenities);
    const preferences = parseMaybeJSON(body.preferences);
    const location = parseMaybeJSON(body.location);
    const rents = parseMaybeJSON(body.rents);
    const houseRules = body.houseRules;
    const whatsNearby = body.whatsNearby;
    const ownerName = body.ownerName;
    const ownerPhone = body.ownerPhone;
    const ownerEmail = body.ownerEmail;
    const propertyType = body.propertyType;
    const totalRooms = body.totalRooms;
    const yearBuilt = body.yearBuilt;
    const furnished = body.furnished === 'true' || body.furnished === true ? true : (body.furnished === 'false' ? false : undefined);

    const room = await Listing.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Check if user is owner
    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this room" });
    }

    // Handle new images
    let images = room.images;
    if (req.files && req.files.images) {
      const uploadedImages = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      for (const image of uploadedImages) {
        const result = await cloudinary.uploader.upload(image.tempFilePath, {
          folder: "rooms",
          width: 1200,
          crop: "scale"
        });
        images.push(result.secure_url);
      }
    }

    const payload = {
      title,
      description,
      address,
      price,
      images,
      availableRooms,
      roomType,
      amenities,
      preferences,
      location,
      rents,
      houseRules,
      whatsNearby,
      ownerName,
      ownerPhone,
      ownerEmail,
      propertyType,
      totalRooms,
      yearBuilt
    };
    if (typeof furnished !== 'undefined') payload.furnished = furnished;

    // Debug: log the payload being saved
    console.log('--- [UPDATE ROOM] Payload received:', JSON.stringify(payload, null, 2));

    // Explicitly set nested rents path to force overwrite
    const updateQuery = { $set: { ...payload, 'rents': payload.rents } };
    const updatedRoom = await Listing.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true }
    ).populate("owner", "fullname email phone profilePicture");

    // Debug: log the updated document
    console.log('--- [UPDATE ROOM] Updated document:', JSON.stringify(updatedRoom, null, 2));

    // Debug: log the updated document
    console.log('--- [UPDATE ROOM] Updated document:', JSON.stringify(updatedRoom, null, 2));

    res.status(200).json({ success: true, message: "Room updated successfully", data: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete room
const deleteRoom = async (req, res) => {
  try {
    const room = await Listing.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Check if user is owner
    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this room" });
    }

    await room.deleteOne();
    res.status(200).json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRooms,
  getRoomDetails,
  createRoom,
  updateRoom,
  deleteRoom
};

// Update listing
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id }, // ensure only owner can update
      { $set: req.body },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found or unauthorized" });
    }

    res.status(200).json({ success: true, message: "Listing updated", data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete listing
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found or unauthorized" });
    }

    res.status(200).json({ success: true, message: "Listing deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all listings (alias for getRooms)
const getAllListings = async (req, res) => {
  return getRooms(req, res);
};

// Get listing by ID (alias for getRoomDetails)
const getListingById = async (req, res) => {
  return getRoomDetails(req, res);
};

// Create listing (alias for createRoom)
const createListing = async (req, res) => {
  return createRoom(req, res);
};

module.exports = {
  getRooms,
  getRoomDetails,
  createRoom,
  updateRoom,
  deleteRoom,
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings
};
