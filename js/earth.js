/**
 * Sky Flight - Earth Rendering Module
 * Creates and manages the 3D Earth with day/night textures
 */

const Earth = {
    mesh: null,
    atmosphere: null,
    nightLights: null,
    radius: 6371, // Earth radius in km (scaled down in scene)
    sceneRadius: 100, // Actual radius in Three.js units
    
    // Texture URLs (NASA Blue Marble and Black Marble)
    textures: {
        day: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
        night: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
        bump: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
        specular: 'https://unpkg.com/three-globe/example/img/earth-water.png'
    },
    
    loadedTextures: {},
    
    /**
     * Initialize Earth mesh
     * @param {THREE.Scene} scene - Three.js scene
     * @returns {Promise<THREE.Group>} Earth group
     */
    async init(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        
        // Load textures
        await this.loadTextures();
        
        // Create Earth mesh
        this.createEarth();
        
        // Create atmosphere glow
        this.createAtmosphere();
        
        // Create night lights layer
        this.createNightLights();
        
        scene.add(this.group);
        
        return this.group;
    },
    
    /**
     * Load all required textures
     * @returns {Promise}
     */
    async loadTextures() {
        const loader = new THREE.TextureLoader();
        
        const loadTexture = (url) => {
            return new Promise((resolve, reject) => {
                loader.load(
                    url,
                    (texture) => resolve(texture),
                    undefined,
                    (error) => {
                        console.warn('Failed to load texture:', url);
                        resolve(null);
                    }
                );
            });
        };
        
        const [dayTexture, nightTexture, bumpTexture, specularTexture] = await Promise.all([
            loadTexture(this.textures.day),
            loadTexture(this.textures.night),
            loadTexture(this.textures.bump),
            loadTexture(this.textures.specular)
        ]);
        
        this.loadedTextures = {
            day: dayTexture,
            night: nightTexture,
            bump: bumpTexture,
            specular: specularTexture
        };
    },
    
    /**
     * Create the main Earth mesh
     */
    createEarth() {
        const geometry = new THREE.SphereGeometry(this.sceneRadius, 64, 64);
        
        const material = new THREE.MeshPhongMaterial({
            map: this.loadedTextures.day,
            bumpMap: this.loadedTextures.bump,
            bumpScale: 0.5,
            specularMap: this.loadedTextures.specular,
            specular: new THREE.Color(0x333333),
            shininess: 5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.group.add(this.mesh);
    },
    
    /**
     * Create atmospheric glow effect
     */
    createAtmosphere() {
        // Outer glow
        const atmosphereGeometry = new THREE.SphereGeometry(this.sceneRadius * 1.025, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.group.add(this.atmosphere);
    },
    
    /**
     * Create night lights layer (city lights)
     */
    createNightLights() {
        if (!this.loadedTextures.night) return;
        
        const geometry = new THREE.SphereGeometry(this.sceneRadius * 1.001, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            map: this.loadedTextures.night,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        
        this.nightLights = new THREE.Mesh(geometry, material);
        this.group.add(this.nightLights);
    },
    
    /**
     * Update day/night based on aircraft position
     * @param {Object} position - Aircraft position { lat, lon }
     * @param {string} mode - 'auto', 'day', or 'night'
     */
    updateDayNight(position, mode) {
        if (!this.nightLights) return;
        
        let nightOpacity = 0;
        
        if (mode === 'night') {
            nightOpacity = 1;
        } else if (mode === 'day') {
            nightOpacity = 0;
        } else {
            // Auto mode - calculate based on position
            const localHour = this.getLocalHour(position.lon);
            // Transition between 6-7 AM and 6-7 PM
            if (localHour >= 6 && localHour <= 7) {
                nightOpacity = 1 - (localHour - 6);
            } else if (localHour >= 18 && localHour <= 19) {
                nightOpacity = localHour - 18;
            } else if (localHour > 7 && localHour < 18) {
                nightOpacity = 0;
            } else {
                nightOpacity = 1;
            }
        }
        
        // Smooth transition
        const currentOpacity = this.nightLights.material.opacity;
        this.nightLights.material.opacity += (nightOpacity - currentOpacity) * 0.02;
    },
    
    /**
     * Get local hour based on longitude
     * @param {number} longitude - Longitude in degrees
     * @returns {number} Local hour (0-24)
     */
    getLocalHour(longitude) {
        const now = new Date();
        const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
        const localHour = (utcHours + longitude / 15 + 24) % 24;
        return localHour;
    },
    
    /**
     * Convert lat/lon to 3D position
     * @param {number} lat - Latitude in degrees
     * @param {number} lon - Longitude in degrees
     * @param {number} altitude - Altitude above Earth surface
     * @returns {THREE.Vector3}
     */
    latLonToVector3(lat, lon, altitude = 0) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        
        const radius = this.sceneRadius + altitude;
        
        const x = -radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        return new THREE.Vector3(x, y, z);
    },
    
    /**
     * Convert 3D position to lat/lon
     * @param {THREE.Vector3} position
     * @returns {Object} { lat, lon, altitude }
     */
    vector3ToLatLon(position) {
        const radius = position.length();
        const altitude = radius - this.sceneRadius;
        
        const lat = 90 - Math.acos(position.y / radius) * (180 / Math.PI);
        const lon = ((Math.atan2(position.z, -position.x) * (180 / Math.PI)) - 180 + 360) % 360 - 180;
        
        return { lat, lon, altitude };
    },
    
    /**
     * Get Earth mesh
     * @returns {THREE.Mesh}
     */
    getMesh() {
        return this.mesh;
    },
    
    /**
     * Get Earth group
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.group;
    }
};
