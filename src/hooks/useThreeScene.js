import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const useThreeScene = (containerRef) => {
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x282c34);
    
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(2, 2, 3);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // Keyboard controls for camera movement
    const moveSpeed = 0.5;
    const keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      KeyW: false,
      KeyS: false,
      KeyA: false,
      KeyD: false
    };

    const handleKeyDown = (event) => {
      switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
          keys.ArrowUp = true;
          keys.KeyW = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          keys.ArrowDown = true;
          keys.KeyS = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          keys.ArrowLeft = true;
          keys.KeyA = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          keys.ArrowRight = true;
          keys.KeyD = true;
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
          keys.ArrowUp = false;
          keys.KeyW = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          keys.ArrowDown = false;
          keys.KeyS = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          keys.ArrowLeft = false;
          keys.KeyA = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          keys.ArrowRight = false;
          keys.KeyD = false;
          break;
      }
    };

    // Add keyboard event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Enhanced lighting setup to ensure white materials appear properly
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); // Increased intensity
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Reduced intensity
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = false; // Disable shadows for better white material rendering
    scene.add(directionalLight);
    
    // Add additional fill light to ensure white materials are well lit
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      
      // Handle keyboard movement
      const delta = clock.getDelta();
      const moveDistance = moveSpeed * delta;
      
      // Get camera's current direction vectors
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      
      camera.getWorldDirection(forward);
      right.crossVectors(forward, camera.up).normalize();
      up.copy(camera.up);
      
      // Move camera based on pressed keys
      if (keys.ArrowUp || keys.KeyW) {
        // Move forward
        camera.position.addScaledVector(forward, moveDistance);
        controls.target.addScaledVector(forward, moveDistance);
      }
      if (keys.ArrowDown || keys.KeyS) {
        // Move backward
        camera.position.addScaledVector(forward, -moveDistance);
        controls.target.addScaledVector(forward, -moveDistance);
      }
      if (keys.ArrowLeft || keys.KeyA) {
        // Move left
        camera.position.addScaledVector(right, -moveDistance);
        controls.target.addScaledVector(right, -moveDistance);
      }
      if (keys.ArrowRight || keys.KeyD) {
        // Move right
        camera.position.addScaledVector(right, moveDistance);
        controls.target.addScaledVector(right, moveDistance);
      }
      
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [containerRef]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    controls: controlsRef.current
  };
};
