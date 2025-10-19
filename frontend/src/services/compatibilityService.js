// Compatibility matching service
class CompatibilityMatcher {
  
  /**
   * Calculate compatibility percentage between user and listing
   * @param {Object} userPreferences - User's preferences and profile data
   * @param {Object} listing - Listing data from backend
   * @returns {number} - Compatibility percentage (0-100)
   */
  static calculateCompatibility(userPreferences, listing) {
    if (!userPreferences || !listing) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    // Gender compatibility (Weight: 25)
    const genderScore = this.calculateGenderCompatibility(userPreferences, listing);
    totalScore += genderScore * 25;
    totalWeight += 25;

    // Budget compatibility (Weight: 20)
    const budgetScore = this.calculateBudgetCompatibility(userPreferences, listing);
    totalScore += budgetScore * 20;
    totalWeight += 20;

    // Amenities compatibility (Weight: 15)
    const amenitiesScore = this.calculateAmenitiesCompatibility(userPreferences, listing);
    totalScore += amenitiesScore * 15;
    totalWeight += 15;

    // Room type/sharing compatibility (Weight: 15)
    const roomTypeScore = this.calculateRoomTypeCompatibility(userPreferences, listing);
    totalScore += roomTypeScore * 15;
    totalWeight += 15;

    // Location/Distance compatibility (Weight: 10)
    const locationScore = this.calculateLocationCompatibility(userPreferences, listing);
    totalScore += locationScore * 10;
    totalWeight += 10;

    // Lifestyle compatibility (Weight: 10)
    const lifestyleScore = this.calculateLifestyleCompatibility(userPreferences, listing);
    totalScore += lifestyleScore * 10;
    totalWeight += 10;

    // Rating bonus (Weight: 5)
    const ratingScore = this.calculateRatingScore(listing);
    totalScore += ratingScore * 5;
    totalWeight += 5;

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Calculate gender compatibility
   */
  static calculateGenderCompatibility(userPreferences, listing) {
    const userGender = userPreferences.gender?.toLowerCase();
    const listingGender = listing.preferences?.gender?.toLowerCase() || listing.gender?.toLowerCase();

    if (!userGender || !listingGender) return 0.5;
    
    if (listingGender === 'any' || userGender === 'any') return 1;
    if (userGender === listingGender) return 1;
    
    return 0;
  }

  /**
   * Calculate budget compatibility
   */
  static calculateBudgetCompatibility(userPreferences, listing) {
    const userMinBudget = userPreferences.budget?.min || 0;
    const userMaxBudget = userPreferences.budget?.max || Infinity;
    const listingPrice = listing.price || 0;

    if (listingPrice >= userMinBudget && listingPrice <= userMaxBudget) {
      // Perfect budget match
      return 1;
    } else if (listingPrice < userMinBudget) {
      // Below minimum budget (might be too cheap/suspicious)
      const ratio = listingPrice / userMinBudget;
      return Math.max(0, ratio);
    } else {
      // Above maximum budget
      const overBudget = listingPrice - userMaxBudget;
      const tolerance = userMaxBudget * 0.2; // 20% tolerance
      if (overBudget <= tolerance) {
        return Math.max(0, 1 - (overBudget / tolerance));
      }
      return 0;
    }
  }

  /**
   * Calculate amenities compatibility
   */
  static calculateAmenitiesCompatibility(userPreferences, listing) {
    const preferredAmenities = userPreferences.preferredAmenities || [];
    const listingAmenities = listing.amenities || [];

    if (preferredAmenities.length === 0) return 0.8; // Default score if no preferences

    const matchingAmenities = preferredAmenities.filter(amenity => 
      listingAmenities.some(listingAmenity => 
        listingAmenity.toLowerCase().includes(amenity.toLowerCase())
      )
    );

    return matchingAmenities.length / preferredAmenities.length;
  }

  /**
   * Calculate room type compatibility
   */
  static calculateRoomTypeCompatibility(userPreferences, listing) {
    const preferredRoommates = userPreferences.preferences?.roommates;
    const listingOccupancy = listing.occupancy || listing.roomType;

    if (!preferredRoommates || !listingOccupancy) return 0.7;

    // Extract number from occupancy string (e.g., "2 sharing" -> 2)
    const occupancyMatch = listingOccupancy.toString().match(/(\d+)/);
    const listingRoommates = occupancyMatch ? parseInt(occupancyMatch[1]) : 1;

    if (listingOccupancy.toLowerCase().includes('studio') || listingOccupancy.toLowerCase().includes('single')) {
      return preferredRoommates === 0 ? 1 : 0.3;
    }

    const difference = Math.abs(preferredRoommates - listingRoommates);
    if (difference === 0) return 1;
    if (difference === 1) return 0.7;
    if (difference === 2) return 0.4;
    return 0.1;
  }

  /**
   * Calculate location compatibility based on distance
   */
  static calculateLocationCompatibility(userPreferences, listing) {
    const distance = listing.distance || 0;
    const maxDistance = userPreferences.maxDistance || 10; // Default 10km

    if (distance <= 1) return 1;
    if (distance <= 2) return 0.9;
    if (distance <= 3) return 0.8;
    if (distance <= 5) return 0.6;
    if (distance <= maxDistance) return 0.4;
    return 0.1;
  }

  /**
   * Calculate lifestyle compatibility
   */
  static calculateLifestyleCompatibility(userPreferences, listing) {
    const userLifestyle = userPreferences.preferences?.lifestyle || {};
    const listingPreferences = listing.preferences || {};

    let matches = 0;
    let total = 0;

    // Smoking compatibility
    if (userLifestyle.smoking && listingPreferences.smoking !== undefined) {
      const userSmoking = userLifestyle.smoking.toLowerCase();
      const listingSmoking = listingPreferences.smoking;
      
      if ((userSmoking === 'yes' && listingSmoking) || 
          (userSmoking === 'no' && !listingSmoking) ||
          userSmoking === 'no preference') {
        matches++;
      }
      total++;
    }

    // Food preferences
    if (userLifestyle.foodPreferences && listingPreferences.foodPreferences) {
      const userFood = userLifestyle.foodPreferences.toLowerCase();
      const listingFood = listingPreferences.foodPreferences.toLowerCase();
      
      if (userFood === listingFood || userFood === 'any' || listingFood === 'any') {
        matches++;
      }
      total++;
    }

    return total > 0 ? matches / total : 0.7;
  }

  /**
   * Calculate rating score bonus
   */
  static calculateRatingScore(listing) {
    const rating = listing.rating || 0;
    return Math.min(rating / 5, 1); // Normalize to 0-1
  }

  /**
   * Sort listings by compatibility score
   */
  static sortByCompatibility(listings, userPreferences) {
    return listings.map(listing => ({
      ...listing,
      compatibility: this.calculateCompatibility(userPreferences, listing)
    })).sort((a, b) => b.compatibility - a.compatibility);
  }

  /**
   * Get compatibility color based on score
   */
  static getCompatibilityColor(score) {
    if (score >= 90) return '#22c55e'; // Green
    if (score >= 80) return '#84cc16'; // Light green
    if (score >= 70) return '#eab308'; // Yellow
    if (score >= 60) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Get compatibility label based on score
   */
  static getCompatibilityLabel(score) {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Great Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    return 'Poor Match';
  }
}

export default CompatibilityMatcher;