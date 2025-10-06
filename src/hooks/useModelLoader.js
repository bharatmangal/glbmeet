import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const useModelLoader = (scene, camera, controls, onModelLoad, onStatusChange) => {
  const currentModelRef = useRef();
  const selectedObjectsRef = useRef([]);
  const selectedObjectBoundsRef = useRef();

  const cleanUp = useCallback(() => {
    if (currentModelRef.current && scene) {
      scene.remove(currentModelRef.current);
    }
    currentModelRef.current = null;
    selectedObjectsRef.current = [];
    selectedObjectBoundsRef.current = null;
  }, [scene]);

  const buildHierarchy = useCallback((model) => {
    if (!model) return [];
    
    const items = [];
    
    const traverseObject = (object, depth = 0, parentId = null) => {
      const item = {
        id: object.uuid,
        name: object.name || `[${object.type}]`,
        depth,
        visible: object.visible,
        isMesh: object.type === 'Mesh',
        hasChildren: object.children && object.children.length > 0,
        parentId,
        object
      };
      
      items.push(item);
      
      if (object.children?.length > 0) {
        object.children.forEach(child => traverseObject(child, depth + 1, object.uuid));
      }
    };
    
    traverseObject(model);
    return items;
  }, []);

  const detectFloorLevels = useCallback(() => {
    if (selectedObjectsRef.current.length === 0) {
      return [];
    }

    const heights = new Set();
    
    selectedObjectsRef.current.forEach(obj => {
      const box = new THREE.Box3().setFromObject(obj);
      const minY = box.min.y;
      const maxY = box.max.y;
      
      heights.add(Math.round(minY * 10) / 10);
      heights.add(Math.round(maxY * 10) / 10);
    });
    
    const sortedHeights = Array.from(heights).sort((a, b) => a - b);
    
    const groupedFloors = [];
    if (sortedHeights.length > 0) {
      let currentGroup = [sortedHeights[0]];
      
      for (let i = 1; i < sortedHeights.length; i++) {
        if (sortedHeights[i] - currentGroup[currentGroup.length - 1] < 0.5) {
          currentGroup.push(sortedHeights[i]);
        } else {
          groupedFloors.push(currentGroup.reduce((a, b) => a + b) / currentGroup.length);
          currentGroup = [sortedHeights[i]];
        }
      }
      
      if (currentGroup.length > 0) {
        groupedFloors.push(currentGroup.reduce((a, b) => a + b) / currentGroup.length);
      }
    }
    
    return groupedFloors;
  }, []);

  const updateSelectedObjects = useCallback(() => {
    selectedObjectsRef.current = [];
    if (!currentModelRef.current) return { objects: [], bounds: null, floors: [] };
    
    currentModelRef.current.traverse((object) => {
      if (object.userData.gridCheckbox && object.userData.gridCheckbox.checked) {
        selectedObjectsRef.current.push(object);
      }
    });
    
    let bounds = null;
    let floors = [];
    
    if (selectedObjectsRef.current.length > 0) {
      const box = new THREE.Box3();
      selectedObjectsRef.current.forEach(obj => {
        box.expandByObject(obj);
      });
      selectedObjectBoundsRef.current = box;
      bounds = box;
      floors = detectFloorLevels();
    } else {
      selectedObjectBoundsRef.current = null;
    }
    
    return { 
      objects: selectedObjectsRef.current, 
      bounds, 
      floors 
    };
  }, [detectFloorLevels]);

  const loadModel = useCallback((file) => {
    if (!file || !scene || !camera || !controls) return;
    
    cleanUp();
    onStatusChange('Loading model...');
    
    const url = URL.createObjectURL(file);
    const gltfLoader = new GLTFLoader();
    
    gltfLoader.load(url, (gltf) => {
      currentModelRef.current = gltf.scene;
      scene.add(currentModelRef.current);

      // Debug: Inspect materials and fix potential issues
      currentModelRef.current.traverse((object) => {
        if (object.isMesh && object.material) {
          console.log(`Object: ${object.name}, Material type:`, object.material);
          
          // Check if this is the GF floor object
          if (object.name === 'GF') {
            console.log('GF Floor object found!');
            console.log('Original material:', object.material);
            console.log('Material color:', object.material.color);
            console.log('Material type:', object.material.type);
            
            // Ensure the material is properly configured for white color
            if (object.material.color) {
              // Force white color if it appears to be white in the original
              const currentColor = object.material.color.getHexString();
              console.log('Current color hex:', currentColor);
              
              // If the material appears to be white or very light, ensure it renders as white
              if (currentColor === 'ffffff' || currentColor === 'fffffe' || currentColor === 'fffffd') {
                console.log('Material is already white, checking lighting setup...');
              } else {
                console.log('Material color is not white, setting to white...');
                object.material.color.setHex(0xffffff);
              }
            }
            
            // Ensure material properties are set for proper white rendering
            if (object.material.type === 'MeshStandardMaterial' || object.material.type === 'MeshPhysicalMaterial') {
              // For PBR materials, ensure proper settings for white color
              object.material.metalness = 0;
              object.material.roughness = 1;
              object.material.emissive.setHex(0x000000);
            }
            
            // Force material to be unlit if it's appearing too dark
            if (object.material.type === 'MeshStandardMaterial' || object.material.type === 'MeshPhysicalMaterial') {
              // Convert to MeshBasicMaterial to avoid lighting calculations
              const basicMaterial = new THREE.MeshBasicMaterial({
                color: object.material.color,
                map: object.material.map,
                transparent: object.material.transparent,
                opacity: object.material.opacity
              });
              object.material = basicMaterial;
              console.log('Converted GF material to MeshBasicMaterial for unlit rendering');
            }
          }
        }
      });

      const box = new THREE.Box3().setFromObject(currentModelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      camera.position.set(center.x, center.y + 2, center.z + 5);
      controls.target.copy(center);
      controls.update();

      const hierarchyItems = buildHierarchy(currentModelRef.current);
      onModelLoad(hierarchyItems);
      onStatusChange('Model loaded successfully. Select objects for grid generation.');

    }, undefined, (error) => {
      console.error('Error loading model:', error);
      onStatusChange('Error loading model.');
    });
  }, [scene, camera, controls, cleanUp, buildHierarchy, onModelLoad, onStatusChange]);

  return {
    currentModel: currentModelRef.current,
    selectedObjects: selectedObjectsRef.current,
    selectedObjectBounds: selectedObjectBoundsRef.current,
    loadModel,
    updateSelectedObjects,
    cleanUp
  };
};
