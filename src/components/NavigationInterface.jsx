import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import './NavigationInterface.css';

const NavigationInterface = ({ 
  markedLocations = [], 
  onStartNavigation, 
  onStopNavigation, 
  isNavigating = false,
  navigationProgress = 0,
  currentStep = null,
  totalSteps = 0
}) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [navigationInstructions, setNavigationInstructions] = useState([]);
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [distance, setDistance] = useState(null);

  // Filter locations based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLocations(markedLocations);
    } else {
      const filtered = markedLocations.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  }, [searchQuery, markedLocations]);

  // Generate navigation instructions
  useEffect(() => {
    if (origin && destination) {
      const instructions = generateNavigationInstructions(origin, destination);
      setNavigationInstructions(instructions);
      
      // Calculate estimated time and distance
      const originLoc = markedLocations.find(loc => loc.id === origin);
      const destLoc = markedLocations.find(loc => loc.id === destination);
      
      if (originLoc && destLoc) {
        const dist = calculateDistance(originLoc, destLoc);
        setDistance(dist);
        setEstimatedTime(Math.round(dist * 0.5)); // Rough estimate: 0.5 minutes per unit
      }
    }
  }, [origin, destination, markedLocations]);

  // Update current instruction based on progress
  useEffect(() => {
    if (navigationInstructions.length > 0 && currentStep !== null) {
      const instructionIndex = Math.floor((currentStep / totalSteps) * navigationInstructions.length);
      if (instructionIndex < navigationInstructions.length) {
        setCurrentInstruction(navigationInstructions[instructionIndex]);
      }
    }
  }, [currentStep, totalSteps, navigationInstructions]);

  const generateNavigationInstructions = (originId, destinationId) => {
    const originLoc = markedLocations.find(loc => loc.id === originId);
    const destLoc = markedLocations.find(loc => loc.id === destinationId);
    
    if (!originLoc || !destLoc) return [];

    const instructions = [
      {
        type: 'start',
        text: `Start at ${originLoc.name}`,
        distance: 0,
        icon: '🚶'
      },
      {
        type: 'turn',
        text: `Head towards ${destLoc.name}`,
        distance: calculateDistance(originLoc, destLoc),
        icon: '➡️'
      },
      {
        type: 'arrive',
        text: `Arrive at ${destLoc.name}`,
        distance: 0,
        icon: '🎯'
      }
    ];

    return instructions;
  };

  const calculateDistance = (loc1, loc2) => {
    const dx = loc1.coordinates.x - loc2.coordinates.x;
    const dy = loc1.coordinates.y - loc2.coordinates.y;
    const dz = loc1.coordinates.z - loc2.coordinates.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const handleOriginSelect = (locationId) => {
    setOrigin(locationId);
    setShowOriginDropdown(false);
    setSearchQuery('');
  };

  const handleDestinationSelect = (locationId) => {
    setDestination(locationId);
    setShowDestinationDropdown(false);
    setSearchQuery('');
  };

  const handleStartNavigation = () => {
    if (origin && destination && origin !== destination) {
      onStartNavigation(origin, destination);
    }
  };

  const handleStopNavigation = () => {
    onStopNavigation();
  };

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const getLocationName = (locationId) => {
    const location = markedLocations.find(loc => loc.id === locationId);
    return location ? location.name : '';
  };

  const canStartNavigation = origin && destination && origin !== destination;

  return (
    <div className="navigation-interface">
      {/* Header */}
      <div className="nav-header">
        <h1>🏢 Indoor Navigation</h1>
        <div className="nav-status">
          {isNavigating ? (
            <span className="status-navigating">Navigating...</span>
          ) : (
            <span className="status-ready">Ready to navigate</span>
          )}
        </div>
      </div>

      {/* Search and Location Selection */}
      <div className="location-selection">
        <div className="location-input-group">
          <label className="location-label">
            <span className="label-icon">📍</span>
            From
          </label>
          <div className="location-input-container">
            <input
              type="text"
              className="location-input"
              placeholder="Select starting point"
              value={getLocationName(origin)}
              readOnly
              onClick={() => setShowOriginDropdown(!showOriginDropdown)}
            />
            <button 
              className="clear-button"
              onClick={() => setOrigin('')}
              disabled={!origin}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="location-input-group">
          <label className="location-label">
            <span className="label-icon">🎯</span>
            To
          </label>
          <div className="location-input-container">
            <input
              type="text"
              className="location-input"
              placeholder="Select destination"
              value={getLocationName(destination)}
              readOnly
              onClick={() => setShowDestinationDropdown(!showDestinationDropdown)}
            />
            <button 
              className="clear-button"
              onClick={() => setDestination('')}
              disabled={!destination}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Swap Button */}
        {origin && destination && (
          <button 
            className="swap-button"
            onClick={handleSwapLocations}
            title="Swap locations"
          >
            ⇄
          </button>
        )}
      </div>

      {/* Location Dropdowns */}
      {(showOriginDropdown || showDestinationDropdown) && (
        <div className="location-dropdown">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="location-list">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className="location-item"
                onClick={() => {
                  if (showOriginDropdown) {
                    handleOriginSelect(location.id);
                  } else {
                    handleDestinationSelect(location.id);
                  }
                }}
              >
                <div className="location-info">
                  <div className="location-name">{location.name}</div>
                  {location.description && (
                    <div className="location-description">{location.description}</div>
                  )}
                </div>
                <div className="location-coordinates">
                  ({location.gridPosition.x}, {location.gridPosition.z})
                </div>
              </div>
            ))}
            {filteredLocations.length === 0 && (
              <div className="no-locations">No locations found</div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="navigation-controls">
        {!isNavigating ? (
          <button
            className="start-navigation-button"
            onClick={handleStartNavigation}
            disabled={!canStartNavigation}
          >
            <span className="button-icon">🚶</span>
            Start Navigation
          </button>
        ) : (
          <button
            className="stop-navigation-button"
            onClick={handleStopNavigation}
          >
            <span className="button-icon">⏹️</span>
            Stop Navigation
          </button>
        )}
      </div>

      {/* Route Information */}
      {origin && destination && (
        <div className="route-info">
          <div className="route-stats">
            {distance && (
              <div className="stat-item">
                <span className="stat-icon">📏</span>
                <span className="stat-value">{distance.toFixed(1)}m</span>
              </div>
            )}
            {estimatedTime && (
              <div className="stat-item">
                <span className="stat-icon">⏱️</span>
                <span className="stat-value">{estimatedTime} min</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Instructions */}
      {isNavigating && navigationInstructions.length > 0 && (
        <div className="navigation-instructions">
          <h3>Navigation Instructions</h3>
          <div className="instructions-list">
            {navigationInstructions.map((instruction, index) => (
              <div
                key={index}
                className={`instruction-item ${
                  currentInstruction === instruction ? 'current' : ''
                }`}
              >
                <div className="instruction-icon">{instruction.icon}</div>
                <div className="instruction-content">
                  <div className="instruction-text">{instruction.text}</div>
                  {instruction.distance > 0 && (
                    <div className="instruction-distance">
                      {instruction.distance.toFixed(1)}m
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isNavigating && totalSteps > 0 && (
        <div className="navigation-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      )}

      {/* Current Instruction */}
      {isNavigating && currentInstruction && (
        <div className="current-instruction">
          <div className="current-instruction-content">
            <span className="current-icon">{currentInstruction.icon}</span>
            <span className="current-text">{currentInstruction.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationInterface;


