import React from 'react';

const FilterPanel = ({ filters, onFilterChange, onApply }) => {
  const defaultFilters = {
    ageRange: [18, 52],
    budgetRange: [5000, 18000],
    gender: "",
    location: "",
    lifestyle: ""
  };

  const handleReset = () => {
    onFilterChange(defaultFilters);
  };
  const handleAgeChange = (e, index) => {
    const newAgeRange = [...filters.ageRange];
    newAgeRange[index] = parseInt(e.target.value);
    
    
    if (index === 0 && newAgeRange[0] > newAgeRange[1]) {
      newAgeRange[1] = newAgeRange[0];
    }
    if (index === 1 && newAgeRange[1] < newAgeRange[0]) {
      newAgeRange[0] = newAgeRange[1];
    }
    
    onFilterChange({
      ...filters,
      ageRange: newAgeRange
    });
  };

  const handleBudgetChange = (e, index) => {
    const newBudgetRange = [...filters.budgetRange];
    newBudgetRange[index] = parseInt(e.target.value);
    
    
    if (index === 0 && newBudgetRange[0] > newBudgetRange[1]) {
      newBudgetRange[1] = newBudgetRange[0];
    }
    if (index === 1 && newBudgetRange[1] < newBudgetRange[0]) {
      newBudgetRange[0] = newBudgetRange[1];
    }
    
    onFilterChange({
      ...filters,
      budgetRange: newBudgetRange
    });
  };

  const handleGenderChange = (e) => {
    onFilterChange({
      ...filters,
      gender: e.target.value
    });
  };

  const handleLocationChange = (e) => {
    onFilterChange({
      ...filters,
      location: e.target.value
    });
  };

  const handleLifestyleChange = (e) => {
    onFilterChange({
      ...filters,
      lifestyle: e.target.value
    });
  };

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
  };

  return (
    <div className="filter-panel">
      <h3>Advanced Filters</h3>
      
      {/* Age Range */}
      <div className="filter-group">
        <label>Age</label>
        <div className="range-container">
          <div className="range-values">
            <span>{filters.ageRange[0]}</span>
            <span>{filters.ageRange[1]}</span>
          </div>
          <div className="range-inputs">
            <input
              type="range"
              min="18"
              max="52"
              value={filters.ageRange[0]}
              onChange={(e) => handleAgeChange(e, 0)}
              className="range-slider min-slider"
            />
            <input
              type="range"
              min="18"
              max="52"
              value={filters.ageRange[1]}
              onChange={(e) => handleAgeChange(e, 1)}
              className="range-slider max-slider"
            />
          </div>
        </div>
      </div>

      {/* Budget Range */}
      <div className="filter-group">
        <label>Budget</label>
        <div className="range-container">
          <div className="range-values">
            <span>₹{filters.budgetRange[0].toLocaleString()}</span>
            <span>₹{filters.budgetRange[1].toLocaleString()}</span>
          </div>
          <div className="range-inputs">
            <input
              type="range"
              min="5000"
              max="18000"
              step="1000"
              value={filters.budgetRange[0]}
              onChange={(e) => handleBudgetChange(e, 0)}
              className="range-slider min-slider"
            />
            <input
              type="range"
              min="5000"
              max="18000"
              step="1000"
              value={filters.budgetRange[1]}
              onChange={(e) => handleBudgetChange(e, 1)}
              className="range-slider max-slider"
            />
          </div>
        </div>
      </div>

      {/* Gender Preference */}
      <div className="filter-group">
        <label>Gender Preference</label>
        <select 
          value={filters.gender} 
          onChange={handleGenderChange}
          className="gender-select"
        >
          <option value="">Any Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-Binary</option>
        </select>
      </div>

      {/* Location */}
      <div className="filter-group">
        <label>Location</label>
        <input
          type="text"
          placeholder="Delhi, Mumbai, Bangalore..."
          value={filters.location}
          onChange={handleLocationChange}
          className="location-input"
        />
      </div>

      {/* Lifestyle */}
      <div className="filter-group">
        <label>Lifestyle</label>
        <select 
          value={filters.lifestyle} 
          onChange={handleLifestyleChange}
          className="lifestyle-select"
        >
          <option value="">Select</option>
          <option value="early_bird">Early Bird</option>
          <option value="night_owl">Night Owl</option>
          <option value="social">Social</option>
          <option value="studious">Studious</option>
          <option value="balanced">Balanced</option>
        </select>
      </div>

      {/* Button Group */}
      <div className="filter-button-group">
        <button className="reset-button" onClick={handleReset}>
          Reset Filters
        </button>
        <button className="apply-button" onClick={handleApply}>
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
