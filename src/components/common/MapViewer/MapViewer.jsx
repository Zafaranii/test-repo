import React, { useState, useEffect } from 'react';
import './MapViewer.css';

const MapViewer = ({ 
  coordinates, 
  mapUrl, 
  address, 
  height = '300px', 
  showControls = true,
  onLocationUpdate 
}) => {
  const [currentCoords, setCurrentCoords] = useState(coordinates || { lat: 30.0444, lng: 31.2357 });
  const [urlInput, setUrlInput] = useState(mapUrl || '');

  useEffect(() => {
    if (coordinates) {
      setCurrentCoords(coordinates);
    }
  }, [coordinates]);

  useEffect(() => {
    if (mapUrl) {
      setUrlInput(mapUrl);
      const extractedCoords = extractCoordsFromUrl(mapUrl);
      if (extractedCoords) {
        setCurrentCoords(extractedCoords);
        onLocationUpdate && onLocationUpdate(extractedCoords);
      }
    }
  }, [mapUrl, onLocationUpdate]);

  const extractCoordsFromUrl = (url) => {
    try {
      // Enhanced patterns to handle more Google Maps URL formats
      const patterns = [
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // @lat,lng format
        /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // q=lat,lng format  
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/, // !3dlat!4dlng format
        /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // ll=lat,lng format
        /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // center=lat,lng format
        /place\/[^/]*@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // place/@lat,lng format
        /data=!3m1!1e3!4m5!3m4!1s[^!]*!8m2!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/, // complex format
        /!2d(-?\d+\.?\d*)!3d(-?\d+\.?\d*)/, // !2dlng!3dlat format (reversed)
      ];

      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = url.match(pattern);
        if (match) {
          // For pattern index 7 (!2dlng!3dlat), coordinates are reversed
          if (i === 7) {
            return {
              lat: parseFloat(match[2]), // lng becomes lat
              lng: parseFloat(match[1])  // lat becomes lng
            };
          }
          return {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
          };
        }
      }

      // Try to extract from URL parameters
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Check for q parameter with coordinates
      const qParam = params.get('q');
      if (qParam) {
        const coordMatch = qParam.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordMatch) {
          return {
            lat: parseFloat(coordMatch[1]),
            lng: parseFloat(coordMatch[2])
          };
        }
      }

    } catch (error) {
}
    return null;
  };

  const handleUrlInput = (url) => {
    setUrlInput(url);
    if (url.trim()) {
      const extractedCoords = extractCoordsFromUrl(url);
      if (extractedCoords) {
        setCurrentCoords(extractedCoords);
        onLocationUpdate && onLocationUpdate(extractedCoords);
      }
    }
  };

  const handleCoordinateChange = (field, value) => {
    const newCoords = {
      ...currentCoords,
      [field]: parseFloat(value) || 0
    };
    setCurrentCoords(newCoords);
    onLocationUpdate && onLocationUpdate(newCoords);
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="map-viewer" style={{ height }}>
      {showControls && (
        <div className="map-controls">
          <div className="url-input-section">
            <label>Google Maps URL:</label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => handleUrlInput(e.target.value)}
              placeholder="Paste Google Maps URL here to extract coordinates..."
              className="url-input"
            />
          </div>
          
          <div className="coordinate-inputs">
            <div className="coord-input">
              <label>Latitude:</label>
              <input
                type="number"
                step="any"
                value={currentCoords.lat}
                onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                placeholder="30.0444"
              />
            </div>
            <div className="coord-input">
              <label>Longitude:</label>
              <input
                type="number"
                step="any"
                value={currentCoords.lng}
                onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                placeholder="31.2357"
              />
            </div>
            <button 
              type="button" 
              className="open-maps-btn"
              onClick={openInGoogleMaps}
              title="Open in Google Maps"
            >
              🗺️ Open in Maps
            </button>
          </div>
        </div>
      )}
      
      <div className="map-container">
        <div className="map-placeholder">
          <div className="map-info">
            <h4>📍 Location Preview</h4>
            <p><strong>Coordinates:</strong> {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}</p>
            {address && <p><strong>Address:</strong> {address}</p>}
            <div className="map-actions">
              <button 
                type="button" 
                className="view-map-btn"
                onClick={openInGoogleMaps}
              >
                🔗 View in Google Maps
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="map-hint">
        💡 Tip: You can paste a Google Maps URL above to automatically extract coordinates, or manually enter latitude and longitude values.
      </div>
    </div>
  );
};

export default MapViewer;