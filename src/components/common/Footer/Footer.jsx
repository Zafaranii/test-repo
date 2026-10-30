import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import AYGLogo from '../../../assets/images/logo/AYG.png';
import { SITE_CONTACT } from '../../../config/siteConfig';
import './Footer.css';

const Footer = () => {
  return (
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
  );
};

export default Footer;
