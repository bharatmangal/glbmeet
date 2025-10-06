import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThreeScene } from './hooks/useThreeScene';
import { useModelLoader } from './hooks/useModelLoader';
import { useWalkingObject } from './hooks/useWalkingObject';
import NavigationInterface from './components/NavigationInterface';
import './App.css';

function App() {
  // Core state for indoor navigation
  const [markedLocations, setMarkedLocations] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0);
  const [currentNavigationStep, setCurrentNavigationStep] = useState(0);
  const [totalNavigationSteps, setTotalNavigationSteps] = useState(0);
  const [navigationPath, setNavigationPath] = useState([]);

  // Refs for Three.js scene
  const containerRef = useRef();
  const { scene, camera, renderer, controls } = useThreeScene(containerRef);

  // Load model functionality
  const {
    currentModel,
    loadModel,
    cleanUp: cleanUpModel
  } = useModelLoader(scene, camera, controls, () => {}, () => {});

  // Walking object for navigation animation
  const {
    setPath: setWalkingPath,
    startOrResumeWalking,
    stopWalking,
    resetPosition: resetWalkerPosition,
    hideWalker,
    showWalker,
    enableCameraFollow,
    disableCameraFollow
  } = useWalkingObject(scene, camera, controls, () => {});

  // Load default model on component mount (for demo purposes)
  useEffect(() => {
    // In a real application, you would load the specific model file
    // For now, we'll load the tower-small.glb from public folder
    const loadDefaultModel = async () => {
      try {
        const response = await fetch('/tower-small.glb');
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], 'tower-small.glb', { type: 'model/gltf-binary' });
          loadModel(file);
        }
      } catch (error) {
        console.log('Default model not found, user will need to load a model');
      }
    };

    loadDefaultModel();
  }, [loadModel]);

  // Navigation handlers
  const handleStartNavigation = (originId, destinationId) => {
    const originLocation = markedLocations.find(loc => loc.id === originId);
    const destinationLocation = markedLocations.find(loc => loc.id === destinationId);

    if (!originLocation || !destinationLocation) {
      return;
    }

    // Create a simple path between the two locations using Three.js Vector3 objects
    const path = [
      new THREE.Vector3(
        originLocation.coordinates.x,
        originLocation.coordinates.y,
        originLocation.coordinates.z
      ),
      new THREE.Vector3(
        destinationLocation.coordinates.x,
        destinationLocation.coordinates.y,
        destinationLocation.coordinates.z
      )
    ];

    // Set the walking path
    setWalkingPath(path);
    setNavigationPath(path);
    setIsNavigating(true);
    setTotalNavigationSteps(path.length);
    setCurrentNavigationStep(0);
    setNavigationProgress(0);

    // Start walking animation
    startOrResumeWalking();
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    stopWalking();
  };

  return (
    <div className="app">
      <div className="navigation-layout">
        <NavigationInterface
          markedLocations={markedLocations}
          onStartNavigation={handleStartNavigation}
          onStopNavigation={handleStopNavigation}
          isNavigating={isNavigating}
          navigationProgress={navigationProgress}
          currentStep={currentNavigationStep}
          totalSteps={totalNavigationSteps}
        />
        <div className="viewer-container" ref={containerRef}></div>
      </div>
    </div>
  );
}

export default App;