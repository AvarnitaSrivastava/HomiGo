
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
    const navigate = useNavigate();
    
    const handleGetStarted = () => {
        navigate('/login');
    };
    
    const handleFindRooms = () => {
        navigate('/login');
    };

    const handleFindRoommates = () => {
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        navigate('/login');
    };

    return (
        <div className="landingpro-container">
            {/* NAV */}
            <header className="landingpro-nav-header">
                <div className="landingpro-nav-inner">
                    <a href="/" className="landingpro-logo" aria-label="HomiGo home">
                        <div className="landingpro-logo-icon">HG</div>
                        <span className="landingpro-logo-text">HomiGo</span>
                    </a>

                    <nav className="landingpro-nav-links">
                        <a href="#features">Features</a>
                        <a href="#rooms">Rooms</a>
                        <a href="#testimonials">Testimonials</a>
                        <button onClick={handleGetStarted} className="landingpro-btn-primary">Sign In</button>
                    </nav>

                    <button className="landingpro-nav-menu-btn" aria-label="Open menu" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        ☰
                    </button>
                </div>
            </header>

            {/* HERO */}
            <main className="landingpro-main">
                <section className="landingpro-hero">
                    <div className="landingpro-hero-text">
                        <h1>Discover modern rooms & perfect roommates — effortlessly.</h1>
                        <p>HomiGo matches you with verified listings and compatible roommates based on your lifestyle and preferences. Browse, message, and book in a few clicks.</p>

                        <div className="landingpro-hero-buttons">
                            <button onClick={handleFindRooms} className="landingpro-btn-primary">Find Rooms</button>
                            <button onClick={handleFindRoommates} className="landingpro-btn-secondary">Find Roommates</button>
                        </div>

                        {/* Search bar */}
                        <form onSubmit={handleSearch} className="landingpro-search-form">
                            <label htmlFor="search" className="sr-only">Where do you want to live?</label>
                            <input id="search" type="text" placeholder="Where do you want to live? e.g. Downtown, Near University" />
                            <select>
                                <option>Any Type</option>
                                <option>Private Room</option>
                                <option>Shared Room</option>
                                <option>Studio</option>
                            </select>
                            <button type="submit" className="landingpro-btn-success">Search</button>
                        </form>

                        <div className="landingpro-hero-features">
                            <div><span>★</span> Verified listings</div>
                            <div><span>🔒</span> Secure chat</div>
                            <div><span>⚡</span> Fast booking</div>
                        </div>
                    </div>

                    <div className="landingpro-hero-image">
                        <img
                            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                            alt="Beautiful living space"
                        />
                        <div className="landingpro-image-card">
                            <img
                                src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80"
                                alt="Cozy Studio"
                            />
                            <div>
                                <div className="landingpro-card-title">Cozy Studio — Downtown</div>
                                <div className="landingpro-card-sub">$1,200 / month • 500 sq ft</div>
                            </div>
                        </div>
                    </div>

                </section>

                {/* FEATURE CARDS */}
                <section id="features" className="landingpro-features">
                    <h2>Why people choose HomiGo</h2>
                    <p>Reliable, verified and crafted for easy roommate matching.</p>
                    <div className="landingpro-feature-cards">
                        <article><div className="icon">🤖</div><h3>Smart Matching</h3><p>AI-driven matching that considers habits, schedules, and preferences.</p></article>
                        <article><div className="icon">✅</div><h3>Verified Listings</h3><p>Every listing undergoes a verification process for safety and quality.</p></article>
                        <article><div className="icon">💬</div><h3>Secure Chat</h3><p>Message prospective roommates without exposing personal contact details.</p></article>
                    </div>
                </section>

                {/* ROOMS GRID */}
                <section id="rooms" className="landingpro-rooms">
                    <div className="landingpro-rooms-header">
                        <h2>Featured Rooms</h2>
                        <a href="#rooms">View all</a>
                    </div>
                    <div className="landingpro-room-cards">
                        <div className="landingpro-room-card">
                            <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80" alt="Luxury Studio" />
                            <div className="landingpro-room-info">
                                <h3>Luxury Studio in Downtown <span className="badge">Featured</span></h3>
                                <p>📍 Downtown Area</p>
                                <div className="landingpro-room-details"><span>🛏️ 1 Bed</span><span>🚿 1 Bath</span><span>📏 500 sq ft</span></div>
                                <div className="landingpro-room-footer"><div>$1,200<span>/month</span></div><button onClick={handleGetStarted} className="landingpro-btn-primary-sm">View Details</button></div>
                            </div>
                        </div>
                        <div className="landingpro-room-card">
                            <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80" alt="Modern 2BR" />
                            <div className="landingpro-room-info">
                                <h3>Modern 2BR with City View <span className="badge new">New</span></h3>
                                <p>📍 Midtown</p>
                                <div className="landingpro-room-details"><span>🛏️ 2 Beds</span><span>🚿 2 Baths</span><span>📏 800 sq ft</span></div>
                                <div className="landingpro-room-footer"><div>$2,000<span>/month</span></div><button onClick={handleGetStarted} className="landingpro-btn-primary-sm">View Details</button></div>
                            </div>
                        </div>
                        <div className="landingpro-room-card">
                            <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80" alt="Cozy Room" />
                            <div className="landingpro-room-info">
                                <h3>Cozy Room in Shared House <span className="badge popular">Popular</span></h3>
                                <p>📍 University Area</p>
                                <div className="landingpro-room-details"><span>🛏️ 1 Bed</span><span>🚿 Shared Bath</span><span>📏 300 sq ft</span></div>
                                <div className="landingpro-room-footer"><div>$800<span>/month</span></div><button onClick={handleGetStarted} className="landingpro-btn-primary-sm">View Details</button></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TESTIMONIALS */}
                <section id="testimonials" className="landingpro-testimonials">
                    <h2>What our users say</h2>
                    <div className="landingpro-testimonial-cards">
                        <blockquote><p>"Found my dream apartment and the perfect roommate within a week! The matching system is incredible."</p><footer><img src="/images/hostels/user1.jpg" alt="Sarah K" /><div><div>Sarah K.</div><div>Graduate Student</div></div></footer></blockquote>
                        <blockquote><p>"The verification process made me feel safe. Found great roommates who became good friends!"</p><footer><img src="/images/hostels/user2.jpg" alt="Michael R" /><div><div>Michael R.</div><div>Young Professional</div></div></footer></blockquote>
                        <blockquote><p>"Best platform for finding rooms near campus. The search filters are super helpful!"</p><footer><img src="/images/hostels/user3.jpg" alt="Emma L" /><div><div>Emma L.</div><div>College Student</div></div></footer></blockquote>
                    </div>
                </section>

                {/* CTA */}
                <section className="landingpro-cta">
                    <div className="landingpro-cta-box">
                        <div>
                            <h3>Ready to find your perfect match?</h3>
                            <p>Join thousands who found their ideal living situation with HomiGo.</p>
                        </div>
                        <div className="landingpro-cta-actions">
                            <button onClick={handleGetStarted} className="landingpro-btn-light">Get Started</button>
                            <a href="#features">Learn more</a>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="landingpro-footer">
                    <div className="landingpro-footer-grid">
                        <div>
                            <h4>HomiGo</h4>
                            <p>Making roommate matching smarter and easier.</p>
                            <div className="landingpro-socials"><a href="#">📱</a><a href="#">💬</a><a href="#">📸</a></div>
                        </div>
                        <div>
                            <h5>Quick Links</h5>
                            <ul><li><a href="#features">Features</a></li><li><a href="#rooms">Browse Rooms</a></li><li><a href="#testimonials">Testimonials</a></li><li><button onClick={handleGetStarted}>Sign In</button></li></ul>
                        </div>
                        <div>
                            <h5>Support</h5>
                            <ul><li><a href="#">Help Center</a></li><li><a href="#">Safety Tips</a></li><li><a href="#">Terms of Service</a></li><li><a href="#">Privacy Policy</a></li></ul>
                        </div>
                    </div>
                    <div className="landingpro-footer-bottom">&copy; 2025 HomiGo. All rights reserved.</div>
                </footer>
            </main>
        </div>
    );
}
