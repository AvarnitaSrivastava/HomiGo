
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from "../services/authService";
import "./AuthModern.css";

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    college: "",
    course: "",
    year: "",
    location: "",
    budget: {
      min: 5000,
      max: 15000
    },
    lifestyle: {
      smoking: "",
      sleepSchedule: "",
      cleanliness: "",
      studyHabits: "",
      social: ""
    },
    preferences: {
      roommates: 2,
      gender: "Any",
      amenities: ["Wi-Fi", "Food", "AC", "Laundry"],
      petFriendly: false,
      music: ""
    },
    // Owner specific fields
    hostelName: "",
    propertyType: "",
    totalRooms: "",
    roomTypes: {
      single: false,
      double: false,
      triple: false,
      sharing: false
    },
    roomRent: {
      single: "",
      double: "",
      triple: "",
      sharing: ""
    },
    facilities: {
      wifi: false,
      ac: false,
      food: false,
      laundry: false,
      cleaning: false,
      security: false,
      parking: false,
      powerBackup: false
    },
    rules: {
      gateClosingTime: "",
      visitorPolicy: "",
      allowedGender: "",
      noticePeriod: ""
    },
    mealOptions: {
      breakfast: false,
      lunch: false,
      dinner: false,
      mealPlan: ""
    },
    description: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Validate required fields
      if (!form.name || !form.email || !form.phone || !form.password) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Validate phone format (assuming 10 digits)
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(form.phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      const userData = {
        fullname: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: role,
        college: form.college,
        course: form.course,
        year: form.year,
        location: form.location,
        budgetMin: form.budget?.min,
        budgetMax: form.budget?.max,
        preferences: {
          gender: form.preferences.gender,
          roommates: form.preferences.roommates,
          amenities: form.preferences.amenities,
          petFriendly: form.preferences.petFriendly,
          lifestyle: form.lifestyle
        }
      };

      const response = await authService.register(userData);

      if (response.success) {
        // Show success message before redirecting
        toast.success('Registration successful! Redirecting to dashboard...');
        // Short delay to show the success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        toast.error(response.message || 'Registration failed. Please try again.');
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (typeof error === 'string') {
        setError(error);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-modern">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Left: Form */}
      <div className="auth-left">
        <div className="auth-form-full">
          <h1 className="auth-heading">Create Account</h1>
          <p className="auth-sub">Join as Student or Owner</p>

          {error && (
            <div style={{
              color: 'red',
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '4px',
              backgroundColor: '#ffebee',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Role Toggle */}
          <div className="role-toggle-split">
            <button
              type="button"
              className={role === "student" ? "active" : ""}
              onClick={() => setRole("student")}
            >
              Student
            </button>
            <button
              type="button"
              className={role === "owner" ? "active" : ""}
              onClick={() => setRole("owner")}
            >
              Owner
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="section-title">Personal Information</div>
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">📱</span>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {role === "student" ? (
              <>
                <div className="section-title">Academic Information</div>
                <div className="input-group">
                  <span className="input-icon">🎓</span>
                  <input
                    type="text"
                    name="college"
                    placeholder="College Name"
                    value={form.college}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-icon">📚</span>
                  <input
                    type="text"
                    name="course"
                    placeholder="Course Name"
                    value={form.course}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-icon">📅</span>
                  <select
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="section-title">Preferences</div>
                <div className="input-group">
                  <span className="input-icon">💰</span>
                  <select
                    name="budgetRange"
                    value={`${form.budget.min}-${form.budget.max}`}
                    onChange={(e) => {
                      const [min, max] = e.target.value.split('-').map(Number);
                      setForm(prev => ({
                        ...prev,
                        budget: { min, max }
                      }));
                    }}
                    required
                  >
                    <option value="">Select Budget Range</option>
                    <option value="5000-8000">₹5,000 - ₹8,000</option>
                    <option value="8000-12000">₹8,000 - ₹12,000</option>
                    <option value="12000-15000">₹12,000 - ₹15,000</option>
                    <option value="15000-20000">₹15,000+</option>
                  </select>
                </div>

                <div className="input-group">
                  <span className="input-icon">⚧</span>
                  <select
                    name="preferences.gender"
                    value={form.preferences.gender}
                    onChange={(e) => {
                      setForm(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          gender: e.target.value
                        }
                      }));
                    }}
                    required
                  >
                    <option value="">Preferred Gender</option>
                    <option value="Any">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="section-title">Lifestyle</div>
                <div className="input-group">
                  <span className="input-icon">�</span>
                  <select
                    name="lifestyle.smoking"
                    value={form.lifestyle.smoking}
                    onChange={(e) => {
                      setForm(prev => ({
                        ...prev,
                        lifestyle: {
                          ...prev.lifestyle,
                          smoking: e.target.value
                        }
                      }));
                    }}
                    required
                  >
                    <option value="">Smoking Preference</option>
                    <option value="Non-smoker">Non-smoker</option>
                    <option value="Occasional smoker">Occasional smoker</option>
                    <option value="Regular smoker">Regular smoker</option>
                  </select>
                </div>

                <div className="input-group">
                  <span className="input-icon">🌙</span>
                  <select
                    name="lifestyle.sleepSchedule"
                    value={form.lifestyle.sleepSchedule}
                    onChange={(e) => {
                      setForm(prev => ({
                        ...prev,
                        lifestyle: {
                          ...prev.lifestyle,
                          sleepSchedule: e.target.value
                        }
                      }));
                    }}
                    required
                  >
                    <option value="">Sleep Schedule</option>
                    <option value="Early bird (6 AM - 10 PM)">Early bird (6 AM - 10 PM)</option>
                    <option value="Night owl (10 PM - 2 AM)">Night owl (10 PM - 2 AM)</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>

                <div className="input-group">
                  <span className="input-icon">🧹</span>
                  <select
                    name="lifestyle.cleanliness"
                    value={form.lifestyle.cleanliness}
                    onChange={(e) => {
                      setForm(prev => ({
                        ...prev,
                        lifestyle: {
                          ...prev.lifestyle,
                          cleanliness: e.target.value
                        }
                      }));
                    }}
                    required
                  >
                    <option value="">Cleanliness Level</option>
                    <option value="Very clean">Very clean</option>
                    <option value="Moderately clean">Moderately clean</option>
                    <option value="Casual">Casual</option>
                  </select>
                </div>

                <div className="input-group">
                  <span className="input-icon">�</span>
                  <select
                    name="lifestyle.studyHabits"
                    value={form.lifestyle.studyHabits}
                    onChange={(e) => {
                      setForm(prev => ({
                        ...prev,
                        lifestyle: {
                          ...prev.lifestyle,
                          studyHabits: e.target.value
                        }
                      }));
                    }}
                    required
                  >
                    <option value="">Study Habits</option>
                    <option value="Study focused">Study focused</option>
                    <option value="Balanced">Balanced</option>
                    <option value="Social focused">Social focused</option>
                  </select>
                </div>

                <div className="input-group">
                  <span className="input-icon">🤝</span>
                  <select
                    name="lifestyle.social"
                    value={form.lifestyle.social}
                    onChange={(e) => {
                      setForm(prev => ({
                        ...prev,
                        lifestyle: {
                          ...prev.lifestyle,
                          social: e.target.value
                        }
                      }));
                    }}
                    required
                  >
                    <option value="">Social Preference</option>
                    <option value="Very social">Very social</option>
                    <option value="Moderately social">Moderately social</option>
                    <option value="Quiet/Private">Quiet/Private</option>
                  </select>
                </div>

                <div className="input-group">
                  <span className="input-icon">🎵</span>
                  <select
                    name="preferences.music"
                    value={form.preferences.music}
                    onChange={(e) => {
                      setForm(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          music: e.target.value
                        }
                      }));
                    }}
                    required
                  >
                    <option value="">Music Preference</option>
                    <option value="Quiet environment preferred">Quiet environment preferred</option>
                    <option value="Moderate music acceptable">Moderate music acceptable</option>
                    <option value="Music lover">Music lover</option>
                  </select>
                </div>
              </>
            ) : (
              // Owner Fields
              <>
                <div className="section-title">Property Information</div>
                <div className="input-group">
                  <span className="input-icon">🏠</span>
                  <input
                    type="text"
                    name="hostelName"
                    placeholder="Hostel/PG Name"
                    value={form.hostelName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-icon">🏢</span>
                  <select
                    name="propertyType"
                    value={form.propertyType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Property Type</option>
                    <option value="pg">Paying Guest (PG)</option>
                    <option value="hostel">Hostel</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>

                <div className="input-group">
                  <span className="input-icon">�</span>
                  <input
                    type="number"
                    name="totalRooms"
                    placeholder="Total Number of Rooms"
                    value={form.totalRooms}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="section-title">Room Types & Rent</div>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="roomTypes.single"
                      checked={form.roomTypes.single}
                      onChange={(e) => {
                        setForm(prev => ({
                          ...prev,
                          roomTypes: {
                            ...prev.roomTypes,
                            single: e.target.checked
                          }
                        }));
                      }}
                    />
                    Single Room
                  </label>
                  {form.roomTypes.single && (
                    <div className="input-group">
                      <span className="input-icon">💰</span>
                      <input
                        type="number"
                        name="roomRent.single"
                        placeholder="Single Room Rent"
                        value={form.roomRent.single}
                        onChange={(e) => {
                          setForm(prev => ({
                            ...prev,
                            roomRent: {
                              ...prev.roomRent,
                              single: e.target.value
                            }
                          }));
                        }}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="roomTypes.double"
                      checked={form.roomTypes.double}
                      onChange={(e) => {
                        setForm(prev => ({
                          ...prev,
                          roomTypes: {
                            ...prev.roomTypes,
                            double: e.target.checked
                          }
                        }));
                      }}
                    />
                    Double Room
                  </label>
                  {form.roomTypes.double && (
                    <div className="input-group">
                      <span className="input-icon">💰</span>
                      <input
                        type="number"
                        name="roomRent.double"
                        placeholder="Double Room Rent"
                        value={form.roomRent.double}
                        onChange={(e) => {
                          setForm(prev => ({
                            ...prev,
                            roomRent: {
                              ...prev.roomRent,
                              double: e.target.value
                            }
                          }));
                        }}
                        required
                      />
                    </div>
                  )}

                </div>
                

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="roomTypes.triple"
                      checked={form.roomTypes.triple}
                      onChange={(e) => {
                        setForm(prev => ({
                          ...prev,
                          roomTypes: {
                            ...prev.roomTypes,
                            triple: e.target.checked
                          }
                        }));
                      }}
                    />
                    Triple Room
                  </label>
                  {form.roomTypes.triple && (
                    <div className="input-group">
                      <span className="input-icon">💰</span>
                      <input
                        type="number"
                        name="roomRent.triple"
                        placeholder="Triple Room Rent"
                        value={form.roomRent.triple}
                        onChange={(e) => {
                          setForm(prev => ({
                            ...prev,
                            roomRent: {
                              ...prev.roomRent,
                              triple: e.target.value
                            }
                          }));
                        }}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="section-title">Facilities</div>                  
                <div className="checkbox-grid">
                  <label>
                    <input
                      type="checkbox"
                      name="facilities.wifi"
                      checked={form.facilities.wifi}
                      onChange={(e) => {
                        setForm(prev => ({
                          ...prev,
                          facilities: {
                            ...prev.facilities,
                            wifi: e.target.checked
                          }
                        }));
                      }}
                    />
                    WiFi
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="facilities.ac"
                      checked={form.facilities.ac}
                      onChange={(e) => {
                        setForm(prev => ({
                          ...prev,
                          facilities: {
                            ...prev.facilities,
                            ac: e.target.checked
                          }
                        }));
                      }}
                    />
                    AC
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="facilities.food"
                      checked={form.facilities.food}
                      onChange={(e) => {
                        setForm(prev => ({
                          ...prev,
                          facilities: {
                            ...prev.facilities,
                            food: e.target.checked
                          }
                        }));
                      }}
                    />
                    Food
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="facilities.laundry"
                      checked={form.facilities.laundry}
                      onChange={(e) => {
                        setForm(prev => ({
                          ...prev,
                          facilities: {
                            ...prev.facilities,
                            laundry: e.target.checked
                          }
                        }));
                      }}
                    />
                    Laundry
                  </label>
                </div>

                <div className="section-title">Rules & Policies</div>
                <div className="input-group">
                  <span className="input-icon">⏰</span>
                  <input
                    type="time"
                    name="rules.gateClosingTime"
                    placeholder="Gate Closing Time"
                    value={form.rules.gateClosingTime}
                    onChange={(e) => {
                      setForm(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          gateClosingTime: e.target.value
                        }
                      }));
                    }}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-icon">👥</span>
                  <select
                    name="rules.allowedGender"
                    value={form.rules.allowedGender}
                    onChange={(e) => {
                      setForm(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          allowedGender: e.target.value
                        }
                      }));
                    }}
                    required
                  >
                    <option value="">Select Allowed Gender</option>
                    <option value="male">Male Only</option>
                    <option value="female">Female Only</option>
                    <option value="both">Both</option>
                  </select>
                </div>






                <div className="input-group">
                  <span className="input-icon">📝</span>
                  <textarea
                    name="description"
                    placeholder="Property Description"
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                    required
                  ></textarea>
                </div>
          </>
          )}

          <div className="section-title">Location</div>
          <div className="input-group">
            <span className="input-icon">📍</span>
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary">
            Create Account
          </button>

          <div className="auth-links">
            <span>
              Already have an account? <Link to="/login">Login</Link>
            </span>
          </div>
        </form>
      </div>
    </div>      {/* Right: Animation */ }
  <div className="auth-right">
    <div className="hero-content">
      <h2>Join HomiGo</h2>
      <p>Discover trusted hostels, PGs, and roommates in seconds.</p>
      <div className="grid-anim big">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="grid-tile"></div>
        ))}
      </div>
    </div>
  </div>
    </div >
  );
}