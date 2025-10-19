const User = require("../models/user.models");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

const getMatches = asyncHandler(async (req, res) => {
    console.log("🎯 getMatches controller called");
    
    // Get the current user's ID from the authenticated request
    const userId = req.user._id;
    console.log("👤 User ID:", userId);

    // Find the current user to get their preferences
    const currentUser = await User.findById(userId);
    console.log("👥 Current user:", currentUser);
    
    if (!currentUser) {
        return res.status(404).json({
            success: false,
            message: "User not found",
            data: []
        });
    }

    // Build the match query based on user preferences
    const matchQuery = {
        _id: { $ne: userId }, // Exclude current user
        role: "student" // Only match with other students
    };

    // Add gender preference if specified and exists
    if (currentUser.preferences && typeof currentUser.preferences === 'object' && currentUser.preferences.gender && currentUser.preferences.gender !== "any") {
        matchQuery.gender = currentUser.preferences.gender;
    }

    // Add location preference if specified and exists
    if (currentUser.preferences && typeof currentUser.preferences === 'object' && currentUser.preferences.location) {
        matchQuery.location = { 
            $regex: currentUser.preferences.location, 
            $options: "i" 
        };
    }

    // Add budget range if specified
    if (currentUser.budget?.min || currentUser.budget?.max) {
        matchQuery.budget = {};
        if (currentUser.budget && currentUser.budget.min) {
            matchQuery.budget.$gte = currentUser.budget.min;
        }
        if (currentUser.budget && currentUser.budget.max) {
            matchQuery.budget.$lte = currentUser.budget.max;
        }
    }

    // Find potential matches
    let potentialMatches = await User.find(matchQuery)
        .select("-password -refreshToken") // Exclude sensitive fields
        .lean(); // Convert to plain JavaScript objects

    // If current user has amenities preferences, filter by amenities overlap
    if (
        currentUser.preferences &&
        typeof currentUser.preferences === 'object' &&
        Array.isArray(currentUser.preferences.amenities) &&
        currentUser.preferences.amenities.length > 0
    ) {
        const userAmenities = currentUser.preferences.amenities;
        potentialMatches = potentialMatches.filter(match => {
            const matchAmenities = (match.preferences && Array.isArray(match.preferences.amenities)) ? match.preferences.amenities : [];
            // Check for at least one common amenity
            return matchAmenities.some(a => userAmenities.includes(a));
        });
    }

    // Return the matches
    return res.json(new ApiResponse(
        200,
        potentialMatches,
        "Potential matches retrieved successfully"
    ));
})

module.exports = {
    getMatches
};