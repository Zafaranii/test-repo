import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie, faLock } from '@fortawesome/free-solid-svg-icons';
import './AdminLanding.css';
import heroImg from '../../../assets/images/backgrounds/LP.jpg';
import AYGLogo from '../../../assets/images/logo/AYG.png';

const AdminLanding = () => {
  return (
    <main className="admin-landing">
      {/* Hero with background image and dark overlay */}
    <section
        className="admin-hero"
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-label="AYG — Admin Portal"
    >
        <div className="admin-hero__overlay" />

        <nav className="admin-landing__nav">
          <div className="brand">
            <img src={AYGLogo} alt="AYG logo" className="brand-logo" />
            <span className="brand-text">AYG</span>
          </div>
        </nav>

        <div className="admin-landing__container">
          <div className="admin-landing__header">
            <h1>
              Welcome to the <span className="admin-accent">Admin Panel</span>
            </h1>
            <p>
              Choose your access level to manage properties, users, and system operations
              with secure authentication and comprehensive dashboard tools.
            </p>
          </div>

          <div className="admin-options">
            <div className="admin-option-card">
              <div className="admin-option-icon"><FontAwesomeIcon icon={faUserTie} /></div>
              <h2>Admin Login</h2>
              <p>
                Access the admin dashboard to manage your properties, handle rental applications,
                and communicate with customers.
              </p>
              <Link to="/admin/login" className="admin-option-btn admin-btn">
                Login as Admin
              </Link>
            </div>

            <div className="admin-option-card">
              <div className="admin-option-icon"><FontAwesomeIcon icon={faLock} /></div>
              <h2>Master Admin</h2>
              <p>
                Full system access for master administrators to manage all users, properties,
                system settings, and advanced configurations.
              </p>
              <Link to="/master-admin/login" className="admin-option-btn master-admin-btn">
                Master Admin Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="admin-landing__footer">
        <p>
          Secure admin portal for AYG
        </p>
      </footer>
    </main>
  );
};

export default AdminLanding;