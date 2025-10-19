import axios from 'axios';
import { RoommateCompatibilityMatcher } from './roommateCompatibilityService';
import api from './api';


const API_URL = `${process.env.REACT_APP_API_URL}/api/matches`;


const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

const matchService = {
  // Get potential matches with compatibility scores
  getMatches: async () => {
    try {
      const response = await api.get('/matches');
      
      // Extract the matches data from the ApiResponse structure
      const matches = response.data.data || [];
      
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      // Calculate compatibility scores for each potential match
      const matchesWithScores = matches.map(match => ({
        ...match,
        compatibility: RoommateCompatibilityMatcher.calculateCompatibility(currentUser, match)
      }));

      // Sort matches by compatibility score in descending order
      return matchesWithScores.sort((a, b) => b.compatibility - a.compatibility);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get match details with compatibility score
  getMatchDetails: async (matchId) => {
    try {
      const response = await axios.get(`${API_URL}/${matchId}`, getAuthHeaders());
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      return {
        ...response.data,
        compatibility: RoommateCompatibilityMatcher.calculateCompatibility(currentUser, response.data)
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Like a match
  likeMatch: async (matchId) => {
    try {
      const response = await axios.post(`${API_URL}/${matchId}/like`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Pass on a match
  passMatch: async (matchId) => {
    try {
      const response = await axios.post(`${API_URL}/${matchId}/pass`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get mutual matches with compatibility scores
  getMutualMatches: async () => {
    try {
      const response = await axios.get(`${API_URL}/mutual`, getAuthHeaders());
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      // Add compatibility scores to mutual matches
      return response.data.map(match => ({
        ...match,
        compatibility: RoommateCompatibilityMatcher.calculateCompatibility(currentUser, match)
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get match stats for dashboard
  getMatchStats: async () => {
    try {
      const matches = await matchService.getMatches();
      return {
        totalMatches: matches.length,
        highCompatibilityMatches: matches.filter(m => m.compatibility >= 80).length,
        moderateCompatibilityMatches: matches.filter(m => m.compatibility >= 60 && m.compatibility < 80).length,
        lowCompatibilityMatches: matches.filter(m => m.compatibility < 60).length
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default matchService;
