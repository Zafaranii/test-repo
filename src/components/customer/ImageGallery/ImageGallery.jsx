import React, { useState, useEffect } from 'react';
import './ImageGallery.css';

const ImageGallery = ({ images, title }) => {
  const validImages = Array.isArray(images)
    ? images.filter((image) => typeof image === 'string' && image.trim().length > 0)
    : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [failedImages, setFailedImages] = useState(() => new Set());

  const availableImages = validImages.filter((image) => !failedImages.has(image));

  const nextImage = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % availableImages.length);
  };

  const prevImage = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + availableImages.length) % availableImages.length);
  };

  const openModal = (index) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Auto-play slider
  useEffect(() => {
    if (availableImages.length <= 1 || isHovered || isModalOpen) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % availableImages.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [availableImages.length, isHovered, isModalOpen]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isModalOpen) return;
      
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % availableImages.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + availableImages.length) % availableImages.length);
      } else if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isModalOpen, availableImages.length]);

  useEffect(() => {
    if (currentIndex >= availableImages.length) {
      setCurrentIndex(0);
    }
  }, [availableImages.length, currentIndex]);

  const handleImageError = (failedSrc) => {
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.add(failedSrc);
      return next;
    });
  };

  if (availableImages.length === 0) {
    return (
      <div className="image-gallery">
        <div className="gallery-slider">
          <div className="slider-container">
            <div className="slider-image" style={{ display: 'grid', placeItems: 'center', color: '#666' }}>
              No Image Available
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      <div 
        className="gallery-slider"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="slider-container">
          <img 
            src={availableImages[currentIndex]} 
            alt={`${title} ${currentIndex + 1}`}
            className="slider-image"
            onError={() => handleImageError(availableImages[currentIndex])}
            onClick={() => openModal(currentIndex)}
          />
          
          {availableImages.length > 1 && (
            <>
              <button className="slider-nav prev" onClick={prevImage}>‹</button>
              <button className="slider-nav next" onClick={nextImage}>›</button>
            </>
          )}
        </div>
        
        {availableImages.length > 1 && (
          <div className="slider-dots">
            {availableImages.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="gallery-modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>×</button>
            <button className="nav-button prev" onClick={prevImage}>‹</button>
            <img 
              src={availableImages[currentIndex]} 
              alt={`${title} ${currentIndex + 1}`}
              className="modal-image"
              onError={() => handleImageError(availableImages[currentIndex])}
            />
            <button className="nav-button next" onClick={nextImage}>›</button>
            <div className="modal-image-counter">
              {currentIndex + 1} / {availableImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;