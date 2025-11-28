/**
 * Sky Flight - Clouds Module
 * Creates cloud layers around Earth for visual reference
 */

const Clouds = {
    group: null,
    clouds: [],
    
    // Cloud settings
    settings: {
        count: 200,          // Number of cloud clusters
        minAltitude: 1,      // Minimum altitude (scene units above Earth)
        maxAltitude: 5,      // Maximum altitude
        minSize: 0.5,
        maxSize: 2,
        rotationSpeed: 0.0001 // Slow rotation for movement
    },
    
    /**
     * Initialize clouds
     * @param {THREE.Scene} scene
     * @returns {THREE.Group}
     */
    init(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        
        this.createClouds();
        
        scene.add(this.group);
        
        return this.group;
    },
    
    /**
     * Create cloud clusters around Earth
     */
    createClouds() {
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < this.settings.count; i++) {
            const cluster = this.createCloudCluster(cloudMaterial);
            this.clouds.push(cluster);
            this.group.add(cluster);
        }
    },
    
    /**
     * Create a single cloud cluster
     * @param {THREE.Material} material
     * @returns {THREE.Group}
     */
    createCloudCluster(material) {
        const cluster = new THREE.Group();
        
        // Random position on Earth surface
        const lat = (Math.random() - 0.5) * 180;
        const lon = Math.random() * 360 - 180;
        const altitude = this.settings.minAltitude + 
            Math.random() * (this.settings.maxAltitude - this.settings.minAltitude);
        
        const position = Earth.latLonToVector3(lat, lon, altitude);
        cluster.position.copy(position);
        
        // Orient to face outward from Earth
        cluster.lookAt(new THREE.Vector3(0, 0, 0));
        
        // Create 3-5 spheres for each cluster
        const cloudCount = 3 + Math.floor(Math.random() * 3);
        const baseSize = this.settings.minSize + 
            Math.random() * (this.settings.maxSize - this.settings.minSize);
        
        for (let i = 0; i < cloudCount; i++) {
            const size = baseSize * (0.5 + Math.random() * 0.5);
            const geometry = new THREE.SphereGeometry(size, 8, 6);
            const cloud = new THREE.Mesh(geometry, material.clone());
            
            // Random offset within cluster
            cloud.position.set(
                (Math.random() - 0.5) * baseSize * 2,
                (Math.random() - 0.5) * baseSize * 0.5,
                (Math.random() - 0.5) * baseSize * 2
            );
            
            // Random opacity variation
            cloud.material.opacity = 0.3 + Math.random() * 0.4;
            
            cluster.add(cloud);
        }
        
        // Store altitude for reference
        cluster.userData.altitude = altitude;
        cluster.userData.baseOpacity = 0.6;
        
        return cluster;
    },
    
    /**
     * Update clouds
     * @param {number} deltaTime
     * @param {Object} aircraft - Aircraft module
     */
    update(deltaTime, aircraft) {
        // Slowly rotate cloud layer for dynamic feel
        this.group.rotation.y += this.settings.rotationSpeed * deltaTime * 60;
        
        // Update cloud opacity based on aircraft proximity
        if (aircraft && aircraft.state.isFlying) {
            const aircraftPos = aircraft.state.position;
            const aircraftAltitude = aircraft.state.altitude;
            
            this.clouds.forEach(cluster => {
                const cloudAltitude = cluster.userData.altitude;
                const altitudeDiff = Math.abs(aircraftAltitude - cloudAltitude);
                
                // Fade clouds when aircraft is at similar altitude (flying through)
                if (altitudeDiff < 2) {
                    const proximity = 1 - (altitudeDiff / 2);
                    const targetOpacity = cluster.userData.baseOpacity * (1 - proximity * 0.5);
                    
                    cluster.children.forEach(cloud => {
                        cloud.material.opacity = THREE.MathUtils.lerp(
                            cloud.material.opacity,
                            targetOpacity,
                            deltaTime * 2
                        );
                    });
                } else {
                    // Restore opacity
                    cluster.children.forEach(cloud => {
                        cloud.material.opacity = THREE.MathUtils.lerp(
                            cloud.material.opacity,
                            cluster.userData.baseOpacity,
                            deltaTime
                        );
                    });
                }
            });
        }
    },
    
    /**
     * Get cloud group
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.group;
    },
    
    /**
     * Dispose of cloud resources
     */
    dispose() {
        this.clouds.forEach(cluster => {
            cluster.children.forEach(cloud => {
                cloud.geometry.dispose();
                cloud.material.dispose();
            });
        });
        
        if (this.scene && this.group) {
            this.scene.remove(this.group);
        }
        
        this.clouds = [];
        this.group = null;
    }
};
