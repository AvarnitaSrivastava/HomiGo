export class RoommateCompatibilityMatcher {
  calculateCompatibility(user1, user2) {
    if (!user1 || !user2) return 0;

    // Define weights for each category that sum to 100
    const weights = {
      budget: 20,      // Max 20 points
      location: 15,    // Max 15 points
      lifestyle: 35,   // Max 35 points (most important)
      academic: 15,    // Max 15 points
      gender: 15       // Max 15 points
    };

    // Calculate individual scores (0-1 range)
    const scores = {
      budget: this.calculateBudgetCompatibility(user1, user2),
      location: this.calculateLocationCompatibility(user1, user2),
      lifestyle: this.calculateLifestyleCompatibility(user1, user2),
      academic: this.calculateAcademicCompatibility(user1, user2),
      gender: this.calculateGenderCompatibility(user1, user2)
    };

    // Calculate weighted sum (will be 0-100)
    const totalScore = Object.entries(weights).reduce((sum, [category, weight]) => {
      return sum + (scores[category] * weight);
    }, 0);

    // Round to nearest integer
    return Math.round(totalScore);
  }

  calculateBudgetCompatibility(user1, user2) {
    const budget1 = user1.budget || {};
    const budget2 = user2.budget || {};

    // Get the budget ranges as they appear in the registration form
    const budgetRanges = {
      '5000-8000': [5000, 8000],
      '8000-12000': [8000, 12000],
      '12000-15000': [12000, 15000],
      '15000-20000': [15000, 20000]
    };

    const min1 = budget1.min || 5000;
    const max1 = budget1.max || 20000;
    const min2 = budget2.min || 5000;
    const max2 = budget2.max || 20000;

    // Calculate overlap
    const overlapStart = Math.max(min1, min2);
    const overlapEnd = Math.min(max1, max2);
    
    if (overlapEnd < overlapStart) return 0; // No overlap

    const overlap = overlapEnd - overlapStart;
    const totalRange = Math.max(max1, max2) - Math.min(min1, min2);
    
    // Calculate score based on overlap percentage
    const score = overlap / totalRange;
    
    // Give bonus points if the ranges are very close
    const rangeCloseness = 1 - (Math.abs(max1 - max2) + Math.abs(min1 - min2)) / (20000 - 5000);
    
    return (score * 0.7) + (rangeCloseness * 0.3); // 70% overlap, 30% closeness
  }

  calculateLocationCompatibility(user1, user2) {
    if (!user1.location || !user2.location) return 0.5;
    
    const location1 = user1.location.toLowerCase();
    const location2 = user2.location.toLowerCase();
    
    if (location1 === location2) return 1;
    
    // Check if locations are in the same area/city
    const location1Parts = location1.split(',').map(part => part.trim());
    const location2Parts = location2.split(',').map(part => part.trim());
    
    // Check if they share any location parts (city, area, etc.)
    const commonParts = location1Parts.filter(part => 
      location2Parts.some(loc2Part => loc2Part.includes(part) || part.includes(loc2Part))
    );
    
    return commonParts.length > 0 ? 0.8 : 0;
  }

  calculateLifestyleCompatibility(user1, user2) {
    const lifestyle1 = user1.lifestyle || user1.preferences || {};
    const lifestyle2 = user2.lifestyle || user2.preferences || {};

    // Define lifestyle factors and their weights (must sum to 100)
    const factorWeights = {
      smoking: 25,         // Critical health/lifestyle factor
      cleanliness: 20,    // Daily living impact
      sleepSchedule: 20,  // Daily routine compatibility
      studyHabits: 20,    // Academic success factor
      social: 15          // Social compatibility
    };

    let totalScore = 0;
    
    // Define acceptable values for each factor as they appear in the registration form
    const factorValues = {
      smoking: ['Non-smoker', 'Occasional smoker', 'Regular smoker'],
      cleanliness: ['Very clean', 'Moderately clean', 'Casual'],
      sleepSchedule: ['Early bird (6 AM - 10 PM)', 'Night owl (10 PM - 2 AM)', 'Flexible'],
      studyHabits: ['Study focused', 'Balanced', 'Social focused'],
      social: ['Very social', 'Moderately social', 'Quiet/Private']
    };
    
    // Calculate score for each factor
    Object.entries(factorWeights).forEach(([factor, weight]) => {
      const val1 = lifestyle1[factor]?.toLowerCase();
      const val2 = lifestyle2[factor]?.toLowerCase();
      
      if (val1 && val2) {
        if (val1 === val2) {
          // Perfect match
          totalScore += weight;
        } else {
          // Check for partial matches
          const values = factorValues[factor];
          const index1 = values.indexOf(val1);
          const index2 = values.indexOf(val2);
          
          if (index1 !== -1 && index2 !== -1) {
            // Calculate how close the values are
            const maxDistance = values.length - 1;
            const actualDistance = Math.abs(index1 - index2);
            const similarity = 1 - (actualDistance / maxDistance);
            
            // Add partial score based on similarity
            totalScore += weight * similarity;
          }
        }
      } else {
        // If one or both values are missing, give partial credit
        totalScore += weight * 0.5;
      }
    });

    // Return a score between 0 and 1 (will be weighted in main compatibility calculation)
    return totalScore / 100;
  }

  calculateAcademicCompatibility(user1, user2) {
    let score = 0;
    let factors = 0;

    // Same college bonus
    if (user1.college && user2.college && 
        user1.college.toLowerCase() === user2.college.toLowerCase()) {
      score += 1;
      factors++;
    }

    // Same course bonus
    if (user1.course && user2.course && 
        user1.course.toLowerCase() === user2.course.toLowerCase()) {
      score += 1;
      factors++;
    }

    // Same year bonus
    if (user1.year && user2.year && user1.year === user2.year) {
      score += 1;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  calculateGenderCompatibility(user1, user2) {
    const gender1 = user1.gender?.toLowerCase();
    const gender2 = user2.gender?.toLowerCase();
    const preference1 = user1.preferences?.gender?.toLowerCase();
    const preference2 = user2.preferences?.gender?.toLowerCase();

    if (!gender1 || !gender2) return 0.5;

    // If either user has no gender preference
    if (preference1 === 'any' || preference2 === 'any') return 1;

    // If both users match each other's gender preferences
    if ((preference1 === gender2 || preference1 === 'any') && 
        (preference2 === gender1 || preference2 === 'any')) {
      return 1;
    }

    return 0;
  }
}