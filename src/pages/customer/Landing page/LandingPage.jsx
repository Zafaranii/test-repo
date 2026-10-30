import './Landingpage.css';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import heroImg from '../../../assets/images/backgrounds/LP.jpg';
import AYGLogo from '../../../assets/images/logo/AYG.png';
import { SITE_CONTACT } from '../../../config/siteConfig';

function LandingPage() {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down
        setIsNavVisible(false);
      } else {
        // Scrolling up
        setIsNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <main className="landing">
      {/* Sticky Navbar */}
      <nav className={`landing__nav ${isNavVisible ? 'nav-visible' : 'nav-hidden'}`}>
        <div className="brand">
          <img src={AYGLogo} alt="AYG logo" className="brand-logo" />
          <span className="brand-text">AYG</span>
        </div>
        <div className="nav-actions">
          <a className="nav-link" href="#options">Services</a>
          <a className="nav-link" href="#contact">Contact</a>
        </div>
      </nav>

      {/* Hero with background image and dark overlay */}
      <section
        className="hero"
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-label="AYG — Real Estate"
      >
        <div className="hero__overlay" />

        <div className="hero__inner">
          <p className="subtitle" style={{display:"flex" ,flexDirection:"column", justifyContent:"center", alignItems:"center", fontSize:"18px", fontWeight:"700"}}>
            <span>We help individuals and businesses find the right place to live and invest.</span>
            <span>Discover modern studios for rent and premium apartments for sale with transparent</span>
            <span>pricing, clear processes, and dedicated support.</span>
          </p>

          <div className="cta-group" style={{display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: '5%'}}>
            <button 
              className="btn btn--primary" 
              onClick={() => document.getElementById('options')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore options
            </button>
            {/* Contact button scrolls to footer contact info */}
          </div>
        </div>
      </section>

      {/* Options section: user can choose rent or buy */}
      <section className="options" id="options" aria-label="Choose a service">
        <article className="option-card">
          <div className="option-card__media" style={{ backgroundImage: `url(${heroImg})` }} aria-hidden />
          {/* Replaced icon with photo thumbnail */}
          <img className="option-card__thumb" src={heroImg} alt="Studio preview" aria-hidden="true" />
          <p className="option-card__text">
            Explore furnished studios in prime locations with flexible terms and quick move-ins.
          </p>
          <Link className="btn btn--primary option-card__btn" to="/studios">Rent a studio</Link>
        </article>

        <article className="option-card">
          <div
            className="option-card__media option-card__media--brand"
            style={{ backgroundImage: `url(${AYGLogo})` }}
            aria-hidden
          />
          <img
            className="option-card__thumb option-card__thumb--brand"
            src={AYGLogo}
            alt="AYG"
            aria-hidden="true"
          />
          <p className="option-card__text">
            Browse our curated apartments for sale with verified listings and expert guidance.
          </p>
          <Link className="btn btn--primary option-card__btn" to="/buy-apartments">Buy an apartment</Link>
        </article>
      </section>

      <footer className="landing__footer" id="contact">
        <div className="footer-content">
          <div className="footer-owner">
            <h3 className="footer-heading">{SITE_CONTACT.ownerTitle}</h3>
            <div className="owner-photo">
              <img src={SITE_CONTACT.ownerPhoto} alt="Owner and Founder" className="founder-img" />
            </div>
              <h3>{SITE_CONTACT.ownerName}</h3>
          </div>
          
          <div className="footer-contact">
            <h3 className="footer-heading">Contact Us</h3>
            <div className="contact-links">
              <a href={SITE_CONTACT.facebookUrl} target="_blank" rel="noopener noreferrer" className="contact-item">
                <FontAwesomeIcon icon={faFacebook} className="contact-icon" />
                <span className="contact-text">Facebook</span>
              </a>
              <a href={SITE_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="contact-item">
                <FontAwesomeIcon icon={faWhatsapp} className="contact-icon" />
                <span className="contact-text">{SITE_CONTACT.phoneDisplay}</span>
              </a>
              <a href={SITE_CONTACT.officeMapUrl} target="_blank" rel="noopener noreferrer" className="contact-item">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="contact-icon" />
                <span className="contact-text">Location on Google Maps</span>
              </a>
            </div>
          </div>

          <div className="footer-info">
            <h3 className="footer-heading">How to find us</h3>
            <div className="info-item">
              <p className="info-text">{SITE_CONTACT.officeHours}</p>
            </div>
            <div className="info-item">
              {SITE_CONTACT.officeAddressLines.map((line) => (
                <p className="info-text" key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} <img src={AYGLogo} alt="AYG" className="footer-logo-inline" /> All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
