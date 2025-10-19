import api from './api';
import CompatibilityMatcher from './compatibilityService';
import authService from './authService';

const roomService = {
  // Get all available rooms with compatibility scores
  getRooms: async function (filters = {}) {
    try {
      const response = await api.get('/listings', { params: filters });
      const listings = response.data.data || response.data;

      // Get current user preferences for compatibility calculation
      let userPreferences = {};
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser.success) {
          userPreferences = currentUser.data;
        }
      } catch (error) {
        // Failed to fetch preferences, will proceed with default values
      }

      // Calculate compatibility for each listing
      const listingsWithCompatibility = listings.map(listing => {
        const transformedListing = this.transformListingData(listing);
        const compatibility = CompatibilityMatcher.calculateCompatibility(userPreferences, transformedListing);
        return {
          ...transformedListing,
          compatibility,
          compatibilityColor: CompatibilityMatcher.getCompatibilityColor(compatibility),
          compatibilityLabel: CompatibilityMatcher.getCompatibilityLabel(compatibility)
        };
      });

      // Sort by compatibility if no specific sort order is requested
      if (!filters.sortBy || filters.sortBy === 'relevance') {
        listingsWithCompatibility.sort((a, b) => b.compatibility - a.compatibility);
      }

      return {
        success: true,
        data: listingsWithCompatibility
      };
    } catch (error) {
      // Return empty array as fallback
      return {
        success: true,
        data: []
      };
    }
  },

  // Get room details with compatibility
  getRoomDetails: async function (roomId) {
    try {
      const response = await api.get(`/listings/${roomId}`);
      const listing = response.data.data || response.data;

      // Get current user preferences for compatibility calculation
      let userPreferences = {};
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser.success) {
          userPreferences = currentUser.data;
        }
      } catch (error) {
        // Could not fetch user preferences; proceed with defaults
      }

      const transformedListing = this.transformListingData(listing);
      const compatibility = CompatibilityMatcher.calculateCompatibility(userPreferences, transformedListing);

      return {
        success: true,
        data: {
          ...transformedListing,
          compatibility,
          compatibilityColor: CompatibilityMatcher.getCompatibilityColor(compatibility),
          compatibilityLabel: CompatibilityMatcher.getCompatibilityLabel(compatibility)
        }
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new room listing
  createRoom: async function (roomData) {
    try {
      const formData = new FormData();

      // Append room data
      Object.keys(roomData).forEach(key => {
        if (key === 'images') {
          roomData[key].forEach(image => {
            formData.append('images', image);
          });
        } else if (typeof roomData[key] === 'object') {
          formData.append(key, JSON.stringify(roomData[key]));
        } else {
          formData.append(key, roomData[key]);
        }
      });

      const response = await api.post('/listings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update room listing
  updateRoom: async function (roomId, roomData) {
    try {
      const formData = new FormData();

      // Append room data
      Object.keys(roomData).forEach(key => {
        if (key === 'images' && Array.isArray(roomData[key])) {
          roomData[key].forEach(image => {
            formData.append('images', image);
          });
        } else if (typeof roomData[key] === 'object') {
          formData.append(key, JSON.stringify(roomData[key]));
        } else {
          formData.append(key, roomData[key]);
        }
      });

      const response = await api.put(`/listings/${roomId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete room listing
  deleteRoom: async function (roomId) {
    try {
      const response = await api.delete(`/listings/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search rooms with advanced filters and compatibility
  searchRooms: async function (searchParams) {
    try {
      const {
        searchTerm,
        priceRange,
        genderFilter,
        amenitiesFilter,
        occupancyFilter,
        ratingFilter,
        distanceFilter,
        sortBy,
        location
      } = searchParams;

      const filters = {};

      if (priceRange && priceRange.length === 2) {
        filters.minPrice = priceRange[0];
        filters.maxPrice = priceRange[1];
      }

      if (amenitiesFilter && amenitiesFilter.length > 0) {
        filters.amenities = amenitiesFilter.join(',');
      }

      if (genderFilter && genderFilter !== 'any') {
        filters.gender = genderFilter;
      }

      if (location) {
        filters.location = location;
      }

      if (searchTerm) {
        filters.search = searchTerm;
      }

      filters.sortBy = sortBy;

      const response = await this.getRooms(filters);
      let listings = response.data;

      // Apply frontend filters that aren't handled by backend
      if (occupancyFilter && occupancyFilter !== 'any') {
        listings = listings.filter(listing => {
          const occupancy = listing.occupancy || listing.roomType || '';
          return occupancy.toLowerCase().includes(occupancyFilter.toLowerCase());
        });
      }

      if (ratingFilter > 0) {
        listings = listings.filter(listing => (listing.rating || 0) >= ratingFilter);
      }

      if (distanceFilter) {
        listings = listings.filter(listing => (listing.distance || 0) <= distanceFilter);
      }

      return {
        success: true,
        data: listings
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Transform backend listing data to frontend format
  transformListingData: function (backendListing) {
    const toNumber = (v, def = 0) => {
      if (v === null || v === undefined || v === '') return def;
      const n = Number(v);
      return Number.isNaN(n) ? def : n;
    };
    // Normalize rents from backend. They may arrive either as numbers
    // or as detailed objects: { rent, available, count }.
    // Rents can arrive as an object or as a JSON string (when passed via multipart/form-data)
    let rents = backendListing.rents || {};
    if (typeof rents === 'string') {
      try {
        rents = JSON.parse(rents);
      } catch {
        // leave as-is; per-item parsing below will still try to coerce
      }
    }
    const parseRentValue = (val) => {
      if (typeof val === 'string') {
        // Try JSON parse first (for objects), then numeric
        try {
          const parsed = JSON.parse(val);
          return parsed;
        } catch {
          const n = Number(val);
          return Number.isNaN(n) ? 0 : n;
        }
      }
      return val;
    };
    const toRentDetails = (raw) => {
      const val = parseRentValue(raw);
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return {
          rent: toNumber(val.rent, 0),
          available: !!val.available,
          count: toNumber(val.count, 0)
        };
      }
      // If value is a number or missing, keep reasonable defaults
      return {
        rent: toNumber(val, 0),
        available: false,
        count: 0
      };
    };

    const rentDetails = {
      single: toRentDetails(rents.single),
      double: toRentDetails(rents.double),
      triple: toRentDetails(rents.triple)
    };

    // Keep flat numeric rents for backward compatibility with existing pages
    const normalizedRents = {
      single: rentDetails.single.rent,
      double: rentDetails.double.rent,
      triple: rentDetails.triple.rent
    };

    // Compute a sensible "starting price" (min positive rent among all types)
    const candidateRents = [rentDetails.single.rent, rentDetails.double.rent, rentDetails.triple.rent]
      .map(n => toNumber(n, 0))
      .filter(n => n > 0);
    const startingPrice = candidateRents.length > 0
      ? Math.min(...candidateRents)
      : toNumber(backendListing.price, 0);

    // Compute available rooms from detailed counts (if available flags are true)
    const availableRoomsComputed =
      (rentDetails.single.available ? rentDetails.single.count : 0) +
      (rentDetails.double.available ? rentDetails.double.count : 0) +
      (rentDetails.triple.available ? rentDetails.triple.count : 0);
    return {
      id: backendListing._id,
      name: backendListing.title,
      type: backendListing.roomType === 'shared' ? 'PG' :
        backendListing.roomType === 'single' ? 'PG' :
          backendListing.roomType === 'apartment' ? 'Apartment' : 'PG',
      price: toNumber(backendListing.price, 0),
  startingPrice,
      distance: backendListing.distance || parseFloat((Math.random() * 5).toFixed(2)),
      rating: backendListing.rating || parseFloat((4 + Math.random()).toFixed(2)), // Fallback for demo
      reviews: backendListing.reviews || Math.floor(Math.random() * 200 + 20),
      occupancy: backendListing.roomType === 'single' ? '1 sharing' :
        backendListing.roomType === 'shared' ? '2 sharing' :
          backendListing.roomType === 'apartment' ? 'Studio' : '1 sharing',
      gender: backendListing.preferences?.gender || 'Any',
  available: availableRoomsComputed > 0 ? true : (toNumber(backendListing.availableRooms, 0) > 0),
  availableRooms: availableRoomsComputed || toNumber(backendListing.availableRooms, 0),
      amenities: backendListing.amenities || [],
      image: backendListing.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      location: backendListing.address,
      address: backendListing.address,
      description: backendListing.description,
      owner: backendListing.owner?.fullname || 'Owner',
      ownerId: backendListing.owner?._id,
      verified: backendListing.verified || Math.random() > 0.3,
      featured: backendListing.featured || Math.random() > 0.7,
      lastUpdated: new Date(backendListing.updatedAt).toLocaleDateString() || 'Today',
      // Additional optional fields for future UI use
  rents: normalizedRents,
  // Detailed rent info for pages that need availability and counts
  rentDetails,
      occupiedRooms: toNumber(backendListing.totalRooms, 0) > 0
        ? Math.max(0, toNumber(backendListing.totalRooms, 0) - (availableRoomsComputed || toNumber(backendListing.availableRooms, 0)))
        : 0,
      houseRules: backendListing.houseRules || '',
      whatsNearby: backendListing.whatsNearby || '',
      propertyType: backendListing.propertyType || '',
      totalRooms: toNumber(backendListing.totalRooms, 0),
      yearBuilt: backendListing.yearBuilt || '',
      furnished: !!backendListing.furnished,
      ownerPhone: backendListing.ownerPhone || '',
      ownerEmail: backendListing.ownerEmail || '',
      ownerName: backendListing.ownerName || (backendListing.owner?.fullname) || 'Owner',
      // Reasonable defaults for management UI
      status: backendListing.status || 'active',
      views: backendListing.views || 0,
      inquiries: backendListing.inquiries || 0
    };
  },

  // Get listings for a specific owner
  getOwnerListings: async function () {
    try {

      const response = await api.get('/listings/my-listings', {
        validateStatus: function (status) {
          return status < 500; // Don't reject if status is less than 500
        }
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch listings');
      }

      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: []
      };
    }
  }
};

export default roomService;