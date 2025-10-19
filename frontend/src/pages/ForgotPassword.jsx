

import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";
import "./AuthModern.css";


export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        setMessage(res.message || "If this email is registered, a reset link will be sent.");
      } else {
        setError(res.message || "Failed to send reset link");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modern">
      {/* Left: Form */}
      <div className="auth-left">
        <div className="auth-form-full">
          <h1 className="auth-heading">Reset Password</h1>
          <p className="auth-sub">Enter your email to receive reset link</p>


          <form onSubmit={handleSubmit} className="scrollable-form">
            <div className="input-group">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>

      {/* Right: Animation */}
      <div className="auth-right">
        <div className="hero-content">
          <h2>Password Reset</h2>
          <p>We’ll send you instructions to securely reset your account.</p>
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