import * as THREE from 'three';

export class WalkingObject {
  constructor(scene) {
    this.scene = scene;
    this.object = null;
    this.path = [];
    this.currentPathIndex = 0;
    this.progress = 0;
    this.isWalking = false;
    this.walkSpeed = 2; // units per second
    this.rotationSpeed = 5; // radians per second
    this.onComplete = null;
    this.onProgress = null;
    
    this.createObject();
  }

  createObject() {
    // Create a simple humanoid character
    const group = new THREE.Group();
    
    // Body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.3;
    group.add(body);
    
    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.75;
    group.add(head);
    
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.25, 0.4, 0);
    leftArm.rotation.z = Math.PI / 6;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.25, 0.4, 0);
    rightArm.rotation.z = -Math.PI / 6;
    group.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.1, -0.25, 0);
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.1, -0.25, 0);
    group.add(rightLeg);
    
    // Store references for animation
    this.bodyParts = {
      body,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg
    };
    
    // Set initial position (will be updated when path is set)
    group.position.set(0, 0, 0);
    group.visible = false; // Hidden until path is set
    
    this.object = group;
    this.scene.add(this.object);
  }

  setPath(worldPath) {
    if (!worldPath || worldPath.length < 2) {
      console.warn('Invalid path provided to walking object');
      return;
    }
    
    this.path = worldPath.map(point => point.clone());
    this.currentPathIndex = 0;
    this.progress = 0;
    this.isWalking = false;
    
    // Position object at start of path
    this.object.position.copy(this.path[0]);
    this.object.visible = true;
    
    // Face the direction of the first segment
    if (this.path.length > 1) {
      this.lookAtNextPoint();
    }
  }

  lookAtNextPoint() {
    if (this.currentPathIndex + 1 < this.path.length) {
      const currentPos = this.path[this.currentPathIndex];
      const nextPos = this.path[this.currentPathIndex + 1];
      
      // Calculate direction vector (only in XZ plane for natural walking)
      const direction = new THREE.Vector3()
        .subVectors(nextPos, currentPos)
        .normalize();
      
      if (direction.length() > 0) {
        // Calculate target rotation (Y-axis rotation only)
        const targetRotationY = Math.atan2(direction.x, direction.z);
        this.object.rotation.y = targetRotationY;
      }
    }
  }

  startWalking() {
    if (this.path.length < 2) {
      console.warn('Cannot start walking: no valid path set');
      return;
    }
    
    this.isWalking = true;
    
    // Only reset to start if we're at the beginning or haven't started
    if (this.currentPathIndex === 0 && this.progress === 0) {
      this.object.position.copy(this.path[0]);
      this.lookAtNextPoint();
      
      if (this.onProgress) {
        this.onProgress(0, this.path.length);
      }
    }
    // If we're already partway through the path, continue from current position
  }

  resumeWalking() {
    if (this.path.length < 2) {
      console.warn('Cannot resume walking: no valid path set');
      return;
    }
    
    this.isWalking = true;
    // Continue from current position without resetting
  }

  isAtStart() {
    return this.currentPathIndex === 0 && this.progress === 0;
  }

  stopWalking() {
    this.isWalking = false;
  }

  resetPosition() {
    if (this.path.length > 0) {
      this.currentPathIndex = 0;
      this.progress = 0;
      this.object.position.copy(this.path[0]);
      this.lookAtNextPoint();
      this.animateIdle();
    }
  }

  hide() {
    this.object.visible = false;
    this.isWalking = false;
  }

  show() {
    this.object.visible = true;
  }

  update(deltaTime) {
    if (!this.isWalking || this.path.length < 2) {
      this.animateIdle();
      return;
    }

    if (this.currentPathIndex >= this.path.length - 1) {
      // Reached the end
      this.isWalking = false;
      this.animateIdle();
      if (this.onComplete) {
        this.onComplete();
      }
      return;
    }

    // Calculate movement
    const currentPos = this.path[this.currentPathIndex];
    const nextPos = this.path[this.currentPathIndex + 1];
    const segmentLength = currentPos.distanceTo(nextPos);
    const moveDistance = this.walkSpeed * deltaTime;
    
    this.progress += moveDistance / segmentLength;

    if (this.progress >= 1) {
      // Move to next segment
      this.currentPathIndex++;
      this.progress = 0;
      
      if (this.currentPathIndex < this.path.length - 1) {
        this.lookAtNextPoint();
      }
      
      if (this.onProgress) {
        this.onProgress(this.currentPathIndex, this.path.length);
      }
    } else {
      // Interpolate position
      const newPosition = new THREE.Vector3().lerpVectors(currentPos, nextPos, this.progress);
      this.object.position.copy(newPosition);
    }

    // Animate walking
    this.animateWalking(deltaTime);
  }

  animateWalking(deltaTime) {
    const time = Date.now() * 0.005;
    const walkCycle = Math.sin(time * this.walkSpeed * deltaTime * 60); // Use deltaTime for frame-rate independence
    
    // Bob the body up and down
    this.bodyParts.body.position.y = 0.3 + Math.abs(walkCycle) * 0.02;
    this.bodyParts.head.position.y = 0.75 + Math.abs(walkCycle) * 0.02;
    
    // Swing arms
    this.bodyParts.leftArm.rotation.x = walkCycle * 0.5;
    this.bodyParts.rightArm.rotation.x = -walkCycle * 0.5;
    
    // Move legs
    this.bodyParts.leftLeg.rotation.x = walkCycle * 0.3;
    this.bodyParts.rightLeg.rotation.x = -walkCycle * 0.3;
  }

  animateIdle() {
    const time = Date.now() * 0.001;
    const idleBob = Math.sin(time) * 0.01;
    
    // Gentle idle breathing animation
    this.bodyParts.body.position.y = 0.3 + idleBob;
    this.bodyParts.head.position.y = 0.75 + idleBob;
    
    // Reset arm and leg positions
    this.bodyParts.leftArm.rotation.x = 0;
    this.bodyParts.rightArm.rotation.x = 0;
    this.bodyParts.leftLeg.rotation.x = 0;
    this.bodyParts.rightLeg.rotation.x = 0;
  }

  destroy() {
    if (this.object && this.scene) {
      this.scene.remove(this.object);
    }
  }

  setWalkSpeed(speed) {
    this.walkSpeed = Math.max(0.1, speed);
  }

  setOnComplete(callback) {
    this.onComplete = callback;
  }

  setOnProgress(callback) {
    this.onProgress = callback;
  }
}
