/**
 * Sky Flight - Aircraft Module
 * Creates and manages aircraft models and flight physics
 */

const Aircraft = {
    mesh: null,
    group: null,
    
    // Aircraft specifications
    types: {
        cessna: {
            name: 'cessna',
            emoji: '🛩️',
            speed: 300, // km/h
            maxSpeed: 400,
            minSpeed: 100,
            handling: 1.0,
            color: 0xffffff,
            accentColor: 0xff0000,
            scale: 0.3
        },
        airliner: {
            name: 'airliner',
            emoji: '✈️',
            speed: 850,
            maxSpeed: 1000,
            minSpeed: 300,
            handling: 0.7,
            color: 0xf0f0f0,
            accentColor: 0x0066cc,
            scale: 0.5
        },
        jet: {
            name: 'jet',
            emoji: '🛫',
            speed: 1500,
            maxSpeed: 2000,
            minSpeed: 500,
            handling: 1.5,
            color: 0x888888,
            accentColor: 0x333333,
            scale: 0.35
        }
    },
    
    currentType: null,
    
    // Flight state
    state: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        speed: 0,
        altitude: 10, // km above surface
        heading: 0, // degrees
        pitch: 0, // degrees
        roll: 0, // degrees
        isFlying: false,
        takeoffAirport: null,
        destinationAirport: null,
        flightStartTime: null
    },
    
    // Control inputs
    input: {
        pitch: 0,
        roll: 0,
        yaw: 0,
        throttle: 0
    },
    
    /**
     * Initialize aircraft
     * @param {THREE.Scene} scene
     * @param {string} type - Aircraft type ('cessna', 'airliner', 'jet')
     * @returns {THREE.Group}
     */
    init(scene, type = 'cessna') {
        this.scene = scene;
        this.group = new THREE.Group();
        
        this.setType(type);
        
        scene.add(this.group);
        
        return this.group;
    },
    
    /**
     * Set aircraft type
     * @param {string} type
     */
    setType(type) {
        if (!this.types[type]) {
            console.warn('Unknown aircraft type:', type);
            type = 'cessna';
        }
        
        this.currentType = this.types[type];
        this.state.speed = this.currentType.speed;
        
        // Remove old mesh if exists
        if (this.mesh) {
            this.group.remove(this.mesh);
            this.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        
        // Create new mesh
        this.mesh = this.createAircraftMesh(type);
        this.group.add(this.mesh);
    },
    
    /**
     * Create low-poly aircraft mesh
     * @param {string} type
     * @returns {THREE.Group}
     */
    createAircraftMesh(type) {
        const spec = this.types[type];
        const aircraft = new THREE.Group();
        
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: spec.color,
            flatShading: true
        });
        const accentMaterial = new THREE.MeshPhongMaterial({ 
            color: spec.accentColor,
            flatShading: true
        });
        
        if (type === 'cessna') {
            // Fuselage
            const fuselage = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.2, 2.5, 8),
                bodyMaterial
            );
            fuselage.rotation.z = Math.PI / 2;
            aircraft.add(fuselage);
            
            // Cockpit
            const cockpit = new THREE.Mesh(
                new THREE.SphereGeometry(0.35, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshPhongMaterial({ color: 0x4488ff, transparent: true, opacity: 0.6 })
            );
            cockpit.position.set(0.3, 0.15, 0);
            cockpit.rotation.z = -Math.PI / 2;
            aircraft.add(cockpit);
            
            // Wings
            const wingGeom = new THREE.BoxGeometry(0.8, 0.05, 3.5);
            const wings = new THREE.Mesh(wingGeom, bodyMaterial);
            wings.position.set(0, 0, 0);
            aircraft.add(wings);
            
            // Tail
            const tailV = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.6, 0.05),
                accentMaterial
            );
            tailV.position.set(-1.1, 0.3, 0);
            aircraft.add(tailV);
            
            const tailH = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.05, 1),
                bodyMaterial
            );
            tailH.position.set(-1.1, 0.1, 0);
            aircraft.add(tailH);
            
            // Propeller
            const propeller = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.6, 0.1),
                accentMaterial
            );
            propeller.position.set(1.3, 0, 0);
            aircraft.add(propeller);
            
        } else if (type === 'airliner') {
            // Fuselage
            const fuselage = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 5, 12),
                bodyMaterial
            );
            fuselage.rotation.z = Math.PI / 2;
            aircraft.add(fuselage);
            
            // Nose
            const nose = new THREE.Mesh(
                new THREE.ConeGeometry(0.5, 1, 12),
                bodyMaterial
            );
            nose.rotation.z = -Math.PI / 2;
            nose.position.x = 3;
            aircraft.add(nose);
            
            // Cockpit windows
            const cockpitWindows = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.2, 0.6),
                new THREE.MeshPhongMaterial({ color: 0x222222 })
            );
            cockpitWindows.position.set(2.3, 0.3, 0);
            aircraft.add(cockpitWindows);
            
            // Wings
            const wingShape = new THREE.Shape();
            wingShape.moveTo(0, 0);
            wingShape.lineTo(0.5, 3);
            wingShape.lineTo(0, 3.2);
            wingShape.lineTo(-0.8, 0);
            
            const wingGeom = new THREE.ExtrudeGeometry(wingShape, { depth: 0.1, bevelEnabled: false });
            
            const leftWing = new THREE.Mesh(wingGeom, bodyMaterial);
            leftWing.rotation.x = Math.PI / 2;
            leftWing.position.set(0, -0.05, 0);
            aircraft.add(leftWing);
            
            const rightWing = new THREE.Mesh(wingGeom, bodyMaterial);
            rightWing.rotation.x = -Math.PI / 2;
            rightWing.position.set(0, 0.05, 0);
            aircraft.add(rightWing);
            
            // Engines
            const engineGeom = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8);
            const leftEngine = new THREE.Mesh(engineGeom, accentMaterial);
            leftEngine.rotation.z = Math.PI / 2;
            leftEngine.position.set(0.5, -0.3, 1.5);
            aircraft.add(leftEngine);
            
            const rightEngine = new THREE.Mesh(engineGeom, accentMaterial);
            rightEngine.rotation.z = Math.PI / 2;
            rightEngine.position.set(0.5, -0.3, -1.5);
            aircraft.add(rightEngine);
            
            // Tail
            const tailV = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 1.2, 0.08),
                accentMaterial
            );
            tailV.position.set(-2.3, 0.8, 0);
            tailV.rotation.z = 0.2;
            aircraft.add(tailV);
            
            const tailH = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.08, 2),
                bodyMaterial
            );
            tailH.position.set(-2.2, 0.2, 0);
            aircraft.add(tailH);
            
        } else if (type === 'jet') {
            // Fuselage
            const fuselage = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.4, 3, 8),
                bodyMaterial
            );
            fuselage.rotation.z = Math.PI / 2;
            aircraft.add(fuselage);
            
            // Nose cone
            const nose = new THREE.Mesh(
                new THREE.ConeGeometry(0.25, 1.2, 8),
                bodyMaterial
            );
            nose.rotation.z = -Math.PI / 2;
            nose.position.x = 2.1;
            aircraft.add(nose);
            
            // Cockpit
            const cockpit = new THREE.Mesh(
                new THREE.SphereGeometry(0.28, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshPhongMaterial({ color: 0x222222, transparent: true, opacity: 0.8 })
            );
            cockpit.position.set(0.8, 0.15, 0);
            cockpit.rotation.z = -Math.PI / 2;
            aircraft.add(cockpit);
            
            // Delta wings
            const wingShape = new THREE.Shape();
            wingShape.moveTo(0, 0);
            wingShape.lineTo(-1.5, 2);
            wingShape.lineTo(-1.8, 0);
            
            const wingGeom = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: false });
            
            const leftWing = new THREE.Mesh(wingGeom, bodyMaterial);
            leftWing.rotation.x = Math.PI / 2;
            leftWing.position.set(0.5, -0.025, 0);
            aircraft.add(leftWing);
            
            const rightWing = new THREE.Mesh(wingGeom, bodyMaterial);
            rightWing.rotation.x = -Math.PI / 2;
            rightWing.position.set(0.5, 0.025, 0);
            aircraft.add(rightWing);
            
            // Tail fins
            const tailV = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.8, 0.04),
                accentMaterial
            );
            tailV.position.set(-1.2, 0.5, 0);
            tailV.rotation.z = 0.3;
            aircraft.add(tailV);
            
            // Engine exhaust
            const exhaust = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.25, 0.3, 8),
                new THREE.MeshPhongMaterial({ color: 0x333333 })
            );
            exhaust.rotation.z = Math.PI / 2;
            exhaust.position.x = -1.65;
            aircraft.add(exhaust);
        }
        
        aircraft.scale.setScalar(spec.scale);
        
        return aircraft;
    },
    
    /**
     * Update aircraft position and physics
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.state.isFlying || !this.mesh) return;
        
        const spec = this.currentType;
        const handling = spec.handling;
        
        // Apply control inputs to rotation
        this.state.pitch += this.input.pitch * handling * 60 * deltaTime;
        this.state.roll += this.input.roll * handling * 60 * deltaTime;
        this.state.heading += this.input.yaw * handling * 30 * deltaTime;
        
        // Bank affects heading (coordinated turn)
        this.state.heading += this.state.roll * 0.5 * deltaTime;
        
        // Apply throttle to speed
        const targetSpeed = this.state.speed + this.input.throttle * 200;
        this.state.speed = THREE.MathUtils.clamp(
            this.state.speed + (targetSpeed - this.state.speed) * deltaTime,
            spec.minSpeed,
            spec.maxSpeed
        );
        
        // Clamp angles
        this.state.pitch = THREE.MathUtils.clamp(this.state.pitch, -80, 80);
        this.state.roll = THREE.MathUtils.clamp(this.state.roll, -60, 60);
        this.state.heading = (this.state.heading + 360) % 360;
        
        // Auto-stabilize when no input
        if (this.input.pitch === 0) {
            this.state.pitch *= 0.98;
        }
        if (this.input.roll === 0) {
            this.state.roll *= 0.98;
        }
        
        // Calculate velocity based on heading and pitch
        const speedInUnits = this.state.speed / 3600 * deltaTime; // km/h to km/s * delta
        const scaledSpeed = speedInUnits * 0.01; // Scale for scene
        
        const pitchRad = THREE.MathUtils.degToRad(this.state.pitch);
        const headingRad = THREE.MathUtils.degToRad(this.state.heading);
        const rollRad = THREE.MathUtils.degToRad(this.state.roll);
        
        // Get forward direction in world space
        const forward = new THREE.Vector3(1, 0, 0);
        forward.applyEuler(new THREE.Euler(pitchRad, headingRad, rollRad, 'YXZ'));
        
        // Move aircraft
        this.state.velocity.copy(forward).multiplyScalar(scaledSpeed);
        this.state.position.add(this.state.velocity);
        
        // Keep aircraft above Earth surface
        const distFromCenter = this.state.position.length();
        const minAltitude = Earth.sceneRadius + 0.5;
        const maxAltitude = Earth.sceneRadius + 50;
        
        if (distFromCenter < minAltitude) {
            this.state.position.normalize().multiplyScalar(minAltitude);
            this.state.altitude = 0.5;
        } else if (distFromCenter > maxAltitude) {
            this.state.position.normalize().multiplyScalar(maxAltitude);
            this.state.altitude = 50;
        } else {
            this.state.altitude = distFromCenter - Earth.sceneRadius;
        }
        
        // Update mesh position and rotation
        this.group.position.copy(this.state.position);
        
        // Orient aircraft to Earth surface
        const up = this.state.position.clone().normalize();
        const lookAt = this.state.position.clone().add(this.state.velocity);
        
        // Create rotation matrix
        const matrix = new THREE.Matrix4();
        matrix.lookAt(this.state.position, lookAt, up);
        
        // Apply local rotations
        const localRotation = new THREE.Euler(
            -pitchRad,
            0,
            -rollRad,
            'YXZ'
        );
        
        this.group.quaternion.setFromRotationMatrix(matrix);
        this.mesh.rotation.copy(localRotation);
    },
    
    /**
     * Set control input
     * @param {Object} input - { pitch, roll, yaw, throttle }
     */
    setInput(input) {
        if (input.pitch !== undefined) this.input.pitch = THREE.MathUtils.clamp(input.pitch, -1, 1);
        if (input.roll !== undefined) this.input.roll = THREE.MathUtils.clamp(input.roll, -1, 1);
        if (input.yaw !== undefined) this.input.yaw = THREE.MathUtils.clamp(input.yaw, -1, 1);
        if (input.throttle !== undefined) this.input.throttle = THREE.MathUtils.clamp(input.throttle, -1, 1);
    },
    
    /**
     * Stabilize the aircraft (return to level flight)
     */
    stabilize() {
        this.state.pitch *= 0.9;
        this.state.roll *= 0.9;
    },
    
    /**
     * Takeoff from an airport
     * @param {Object} airport - Airport data
     */
    takeoff(airport) {
        const position = Earth.latLonToVector3(airport.lat, airport.lon, 2);
        this.state.position.copy(position);
        this.state.altitude = 2;
        this.state.heading = 0;
        this.state.pitch = 0;
        this.state.roll = 0;
        this.state.speed = this.currentType.speed;
        this.state.isFlying = true;
        this.state.takeoffAirport = airport;
        this.state.flightStartTime = Date.now();
        
        this.group.position.copy(this.state.position);
    },
    
    /**
     * Set destination airport
     * @param {Object} airport - Airport data
     */
    setDestination(airport) {
        this.state.destinationAirport = airport;
    },
    
    /**
     * Get distance to destination
     * @returns {number} Distance in km
     */
    getDistanceToDestination() {
        if (!this.state.destinationAirport) return null;
        
        const destPos = Earth.latLonToVector3(
            this.state.destinationAirport.lat,
            this.state.destinationAirport.lon,
            0
        );
        
        const distance = this.state.position.distanceTo(destPos);
        return distance * (Earth.radius / Earth.sceneRadius);
    },
    
    /**
     * Get flight time in seconds
     * @returns {number}
     */
    getFlightTime() {
        if (!this.state.flightStartTime) return 0;
        return (Date.now() - this.state.flightStartTime) / 1000;
    },
    
    /**
     * Get current position in lat/lon
     * @returns {Object} { lat, lon, altitude }
     */
    getPosition() {
        return Earth.vector3ToLatLon(this.state.position);
    },
    
    /**
     * Get aircraft group
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.group;
    },
    
    /**
     * Get current state
     * @returns {Object}
     */
    getState() {
        return this.state;
    },
    
    /**
     * Get current type specification
     * @returns {Object}
     */
    getCurrentType() {
        return this.currentType;
    }
};
