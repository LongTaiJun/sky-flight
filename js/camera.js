/**
 * Sky Flight - Camera Module
 * Manages camera views and transitions
 */

const Camera = {
    camera: null,
    currentView: 'thirdPerson',
    views: ['thirdPerson', 'cockpit', 'overhead'],
    
    // View parameters
    viewSettings: {
        thirdPerson: {
            distance: 5,
            height: 2,
            fov: 60
        },
        cockpit: {
            distance: 0,
            height: 0.2,
            fov: 90
        },
        overhead: {
            distance: 20,
            height: 15,
            fov: 45
        }
    },
    
    // Transition state
    transition: {
        active: false,
        progress: 0,
        from: null,
        to: null,
        duration: 0.5
    },
    
    // Current camera state
    state: {
        distance: 5,
        height: 2,
        fov: 60
    },
    
    // Camera shake
    shake: {
        intensity: 0,
        time: 0
    },
    
    // Speed effect
    baseFOV: 60,
    currentFOV: 60,
    
    /**
     * Initialize camera
     * @param {THREE.PerspectiveCamera} camera
     */
    init(camera) {
        this.camera = camera;
        this.setView('thirdPerson', false);
    },
    
    /**
     * Set camera view
     * @param {string} view - View name
     * @param {boolean} animate - Whether to animate transition
     */
    setView(view, animate = true) {
        if (!this.views.includes(view)) return;
        
        if (animate && this.currentView !== view) {
            this.transition.active = true;
            this.transition.progress = 0;
            this.transition.from = { ...this.state };
            this.transition.to = this.viewSettings[view];
        } else {
            this.state = { ...this.viewSettings[view] };
            this.camera.fov = this.state.fov;
            this.camera.updateProjectionMatrix();
        }
        
        this.currentView = view;
    },
    
    /**
     * Cycle to next view
     */
    nextView() {
        const currentIndex = this.views.indexOf(this.currentView);
        const nextIndex = (currentIndex + 1) % this.views.length;
        this.setView(this.views[nextIndex], true);
        
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('viewChanged', {
            detail: { view: this.views[nextIndex] }
        }));
    },
    
    /**
     * Update camera position based on aircraft
     * @param {Object} aircraft - Aircraft module
     * @param {number} deltaTime
     */
    update(aircraft, deltaTime) {
        if (!aircraft.state.isFlying || !aircraft.group) return;
        
        // Handle transition animation
        if (this.transition.active) {
            this.transition.progress += deltaTime / this.transition.duration;
            
            if (this.transition.progress >= 1) {
                this.transition.active = false;
                this.transition.progress = 1;
            }
            
            // Smooth interpolation
            const t = this.easeInOutCubic(this.transition.progress);
            
            this.state.distance = THREE.MathUtils.lerp(
                this.transition.from.distance,
                this.transition.to.distance,
                t
            );
            this.state.height = THREE.MathUtils.lerp(
                this.transition.from.height,
                this.transition.to.height,
                t
            );
            this.state.fov = THREE.MathUtils.lerp(
                this.transition.from.fov,
                this.transition.to.fov,
                t
            );
            
            this.baseFOV = this.state.fov;
        }
        
        // Speed-based FOV effect (speed sense)
        const speedRatio = aircraft.state.speed / aircraft.currentType.maxSpeed;
        const targetFOV = this.baseFOV + speedRatio * 15; // Max +15 degrees at max speed
        this.currentFOV = THREE.MathUtils.lerp(this.currentFOV, targetFOV, 0.05);
        this.camera.fov = this.currentFOV;
        this.camera.updateProjectionMatrix();
        
        // Camera shake during takeoff phases
        const flightPhase = aircraft.getFlightPhase();
        if (flightPhase === 'takeoff_roll' || flightPhase === 'climbing') {
            this.shake.intensity = 0.05;
        } else if (flightPhase === 'taxiing') {
            this.shake.intensity = 0.02;
        } else {
            this.shake.intensity = THREE.MathUtils.lerp(this.shake.intensity, 0, 0.05);
        }
        
        this.shake.time += deltaTime * 20;
        
        // Get aircraft position and orientation
        const aircraftPos = aircraft.group.position.clone();
        const up = aircraftPos.clone().normalize();
        
        // Calculate camera position based on view
        if (this.currentView === 'cockpit') {
            // First person - inside cockpit
            const cockpitOffset = new THREE.Vector3(0.5, 0.2, 0);
            cockpitOffset.applyQuaternion(aircraft.group.quaternion);
            
            this.camera.position.copy(aircraftPos).add(cockpitOffset);
            
            // Look in flight direction
            const forward = new THREE.Vector3(1, 0, 0);
            forward.applyQuaternion(aircraft.group.quaternion);
            forward.applyEuler(aircraft.mesh.rotation);
            
            const lookAtPos = this.camera.position.clone().add(forward.multiplyScalar(10));
            this.camera.lookAt(lookAtPos);
            this.camera.up.copy(up);
            
        } else if (this.currentView === 'thirdPerson') {
            // Third person - behind and above aircraft
            const backward = new THREE.Vector3(-1, 0, 0);
            backward.applyQuaternion(aircraft.group.quaternion);
            
            const upOffset = up.clone().multiplyScalar(this.state.height);
            const backOffset = backward.multiplyScalar(this.state.distance);
            
            const targetPos = aircraftPos.clone()
                .add(upOffset)
                .add(backOffset);
            
            // Smoother camera follow - reduced from 0.1 to 0.03
            this.camera.position.lerp(targetPos, 0.03);
            
            // Apply camera shake
            if (this.shake.intensity > 0.001) {
                const shakeX = Math.sin(this.shake.time) * this.shake.intensity;
                const shakeY = Math.cos(this.shake.time * 1.3) * this.shake.intensity;
                this.camera.position.add(up.clone().multiplyScalar(shakeY));
                
                const right = new THREE.Vector3().crossVectors(up, backward).normalize();
                this.camera.position.add(right.multiplyScalar(shakeX));
            }
            
            this.camera.lookAt(aircraftPos);
            this.camera.up.copy(up);
            
        } else if (this.currentView === 'overhead') {
            // Overhead view - looking down at aircraft
            const upOffset = up.clone().multiplyScalar(this.state.height);
            const backOffset = new THREE.Vector3(-1, 0, 0);
            backOffset.applyQuaternion(aircraft.group.quaternion);
            backOffset.multiplyScalar(this.state.distance * 0.5);
            
            const targetPos = aircraftPos.clone()
                .add(upOffset)
                .add(backOffset);
            
            this.camera.position.lerp(targetPos, 0.03);
            this.camera.lookAt(aircraftPos);
            this.camera.up.copy(up);
        }
    },
    
    /**
     * Easing function for smooth transitions
     * @param {number} t - Progress (0-1)
     * @returns {number}
     */
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    
    /**
     * Get current view name
     * @returns {string}
     */
    getCurrentView() {
        return this.currentView;
    },
    
    /**
     * Position camera for Earth exploration (pre-flight)
     * @param {THREE.Vector3} targetPosition
     */
    orbitAround(targetPosition) {
        const distance = 200;
        this.camera.position.set(distance, distance / 2, distance);
        this.camera.lookAt(targetPosition || new THREE.Vector3(0, 0, 0));
    }
};
