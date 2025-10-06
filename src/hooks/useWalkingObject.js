import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { WalkingObject } from '../utils/WalkingObject';

export const useWalkingObject = (scene, camera, controls, onStatusChange) => {
  const walkingObjectRef = useRef();
  const animationFrameRef = useRef();
  const lastTimeRef = useRef(0);
  const cameraFollowEnabledRef = useRef(false);
  const cameraOffsetRef = useRef({ x: 0, y: 2, z: -3 }); // Closer behind and above the object
  const cameraTargetPositionRef = useRef(new THREE.Vector3());
  const cameraTargetLookAtRef = useRef(new THREE.Vector3());

  // Initialize walking object
  useEffect(() => {
    if (scene) {
      walkingObjectRef.current = new WalkingObject(scene);
      
      // Set up callbacks
      walkingObjectRef.current.setOnComplete(() => {
        onStatusChange('Walking animation completed!');
      });
      
      walkingObjectRef.current.setOnProgress((currentIndex, totalSteps) => {
        onStatusChange(`Walking progress: ${currentIndex}/${totalSteps - 1} steps`);
      });

      // Start animation loop
      const animate = (currentTime) => {
        const deltaTime = (currentTime - lastTimeRef.current) / 1000;
        lastTimeRef.current = currentTime;
        
        if (walkingObjectRef.current) {
          walkingObjectRef.current.update(deltaTime);
          
          // Update camera to follow the walking object with smooth transitions
          if (cameraFollowEnabledRef.current && camera && controls && walkingObjectRef.current.object) {
            const objectPosition = walkingObjectRef.current.object.position;
            const objectRotation = walkingObjectRef.current.object.rotation;
            const offset = cameraOffsetRef.current;
            
            // Calculate desired camera position behind the object based on its rotation
            const cameraOffset = new THREE.Vector3(offset.x, offset.y, offset.z);
            
            // Rotate the offset vector by the object's Y rotation to keep camera behind
            const rotationMatrix = new THREE.Matrix4().makeRotationY(objectRotation.y);
            cameraOffset.applyMatrix4(rotationMatrix);
            
            // Calculate target positions
            const targetCameraPosition = objectPosition.clone().add(cameraOffset);
            const targetLookAt = objectPosition.clone();
            targetLookAt.y += 0.3; // Look at object's chest level
            
            // Smooth camera position interpolation (lerp factor controls smoothness)
            const lerpFactor = Math.min(deltaTime * 8, 1); // Adjust speed with deltaTime
            
            // Store target positions for smooth interpolation
            cameraTargetPositionRef.current.copy(targetCameraPosition);
            cameraTargetLookAtRef.current.copy(targetLookAt);
            
            // Smoothly interpolate camera position
            camera.position.lerp(cameraTargetPositionRef.current, lerpFactor);
            
            // Smoothly interpolate look-at target
            const currentTarget = controls.target.clone();
            currentTarget.lerp(cameraTargetLookAtRef.current, lerpFactor);
            
            // Update camera orientation
            camera.lookAt(currentTarget);
            
            // Update controls target smoothly
            controls.target.copy(currentTarget);
            controls.update();
          }
        }
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (walkingObjectRef.current) {
        walkingObjectRef.current.destroy();
      }
    };
  }, [scene, onStatusChange]);

  const setPath = useCallback((worldPath) => {
    if (walkingObjectRef.current) {
      walkingObjectRef.current.setPath(worldPath);
      onStatusChange('Walking path set. Use controls to start animation.');
    }
  }, [onStatusChange]);

  const startWalking = useCallback(() => {
    if (walkingObjectRef.current) {
      walkingObjectRef.current.startWalking();
      cameraFollowEnabledRef.current = true; // Enable camera following when walking starts
      onStatusChange('Walking animation started! Camera following enabled.');
    }
  }, [onStatusChange]);

  const resumeWalking = useCallback(() => {
    if (walkingObjectRef.current) {
      walkingObjectRef.current.resumeWalking();
      cameraFollowEnabledRef.current = true; // Enable camera following when walking resumes
      onStatusChange('Walking animation resumed! Camera following enabled.');
    }
  }, [onStatusChange]);

  const startOrResumeWalking = useCallback(() => {
    if (walkingObjectRef.current) {
      if (walkingObjectRef.current.isAtStart()) {
        walkingObjectRef.current.startWalking();
        onStatusChange('Walking animation started! Camera following enabled.');
      } else {
        walkingObjectRef.current.resumeWalking();
        onStatusChange('Walking animation resumed! Camera following enabled.');
      }
      cameraFollowEnabledRef.current = true;
    }
  }, [onStatusChange]);

  const stopWalking = useCallback(() => {
    if (walkingObjectRef.current) {
      walkingObjectRef.current.stopWalking();
      cameraFollowEnabledRef.current = false; // Disable camera following when walking stops
      onStatusChange('Walking animation stopped. Camera following disabled.');
    }
  }, [onStatusChange]);

  const resetPosition = useCallback(() => {
    if (walkingObjectRef.current) {
      walkingObjectRef.current.resetPosition();
      onStatusChange('Walker reset to starting position.');
    }
  }, [onStatusChange]);

  const hideWalker = useCallback(() => {
    if (walkingObjectRef.current) {
      walkingObjectRef.current.hide();
      onStatusChange('Walker hidden.');
    }
  }, [onStatusChange]);

  const showWalker = useCallback(() => {
    if (walkingObjectRef.current) {
      walkingObjectRef.current.show();
      onStatusChange('Walker shown.');
    }
  }, [onStatusChange]);

  const setWalkSpeed = useCallback((speed) => {
    if (walkingObjectRef.current) {
      walkingObjectRef.current.setWalkSpeed(speed);
      onStatusChange(`Walking speed set to ${speed.toFixed(1)}`);
    }
  }, [onStatusChange]);

  const enableCameraFollow = useCallback(() => {
    cameraFollowEnabledRef.current = true;
    onStatusChange('Camera following enabled.');
  }, [onStatusChange]);

  const disableCameraFollow = useCallback(() => {
    cameraFollowEnabledRef.current = false;
    onStatusChange('Camera following disabled.');
  }, [onStatusChange]);

  const setCameraOffset = useCallback((offset) => {
    cameraOffsetRef.current = { ...offset };
    onStatusChange(`Camera offset updated: x=${offset.x}, y=${offset.y}, z=${offset.z}`);
  }, [onStatusChange]);

  return {
    setPath,
    startWalking,
    resumeWalking,
    startOrResumeWalking,
    stopWalking,
    resetPosition,
    hideWalker,
    showWalker,
    setWalkSpeed,
    enableCameraFollow,
    disableCameraFollow,
    setCameraOffset,
    walkingObject: walkingObjectRef.current
  };
};
