
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from "../services/authService";
import "./AuthModern.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");

  const handleChange = (e) => {
  setForm({ ...form, [e.target.name]: e.target.value });
  // Only clear error if user starts typing after an error is shown
  if (error) setError("");
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(""); // Clear previous errors
      // Client-side validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }
      if (!form.password.trim()) {
        setError("Password is required");
        setIsLoading(false);
        return;
      }
      const response = await authService.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: role
      });
      if (response.success) {
        setError(""); // Clear any existing errors
        // Get user role from response or localStorage
        let userRole = response.data?.user?.role;
        if (!userRole) {
          try {
            const stored = localStorage.getItem('user');
            if (stored) {
              userRole = JSON.parse(stored).role;
            }
          } catch {}
        }
        const redirectPath = userRole === 'owner' ? '/owner-dashboard' : '/dashboard';
        toast.success("Login successful!", {
          position: "top-right",
          autoClose: 1500,
          onClose: () => navigate(redirectPath)
        });
      } else {
        // Handle different types of errors
        const errorMsg = response.message;
        setError(errorMsg); // Set error immediately
        if (errorMsg.toLowerCase().includes('password')) {
          // Password-specific error handling
          setForm(prev => ({ ...prev, password: '' })); // Clear password field
          const passwordInput = document.querySelector('input[type="password"]');
          if (passwordInput) {
            passwordInput.focus(); // Focus password field
          }
          toast.error(errorMsg, {
            position: "top-center",
            autoClose: false, // Keep it visible until user closes
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: 'password-error-toast'
          });
        } else {
          // Other errors
          toast.error(errorMsg, {
            position: "top-right",
            autoClose: 5000
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = 
        error.response?.data?.message ||
        error.message ||
        "An error occurred during login";
      setError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: false // Error toast stays until user closes
      });
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
          <h1 className="auth-heading">Welcome Back</h1>
          <p className="auth-sub">Sign in to continue</p>
          {/* Role Toggle */}
          <div className="role-toggle-split" style={{ marginBottom: '1rem' }}>
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
          {/* Error Display */}
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          {error && (
            <div 
              style={{
                color: '#d32f2f',
                padding: '12px',
                margin: '15px 0',
                borderRadius: '4px',
                backgroundColor: '#ffebee',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'fadeIn 0.3s ease-in'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                {/* Error icon */}
                <span role="img" aria-label="error" style={{ fontSize: '16px' }}>
                  ⚠️
                </span>
                <span style={{ fontWeight: '500' }}>{error}</span>
              </div>
              
              {error.toLowerCase().includes('password') && (
                <div style={{
                  marginTop: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <Link 
                    to="/forgot-password"
                    style={{
                      color: '#1976d2',
                      fontSize: '0.9em',
                      textDecoration: 'none',
                      fontWeight: '500',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Forgot your password? Click here to reset
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="scrollable-form">
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

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary">Sign In</button>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <span>
              Don’t have an account? <Link to="/Register">Create one</Link>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Animation */}
      <div className="auth-right">
        <div className="hero-content">
          <h2>Welcome to HomiGo</h2>
          <p>Find your ideal hostel/PG and roommates in just a few clicks.</p>
          <div className="grid-anim big">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="grid-tile"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}