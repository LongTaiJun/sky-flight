/**
 * Sky Flight - Main Entry Point
 * Flight simulator game with 3D Earth and aircraft
 */

// Game state
const Game = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    
    // Interaction
    raycaster: null,
    mouse: new THREE.Vector2(),
    
    // Orbit controls for pre-flight
    orbitControls: null,
    
    // State
    isFlying: false,
    isPaused: false,
    
    /**
     * Initialize the game
     */
    async init() {
        // Show loading screen
        this.showLoading();
        
        // Initialize Three.js
        this.initThree();
        
        // Initialize modules
        await this.initModules();
        
        // Setup event listeners
        this.setupEvents();
        
        // Hide loading screen
        this.hideLoading();
        
        // Start game loop
        this.animate();
        
        // Show welcome UI
        this.showWelcome();
    },
    
    /**
     * Initialize Three.js scene, camera, renderer
     */
    initThree() {
        const qualityConfig = Settings.getQualityConfig();
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(200, 100, 200);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: qualityConfig.antialias,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(qualityConfig.pixelRatio);
        
        if (qualityConfig.shadowMapEnabled) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Clock
        this.clock = new THREE.Clock();
        
        // Raycaster for mouse/touch interaction
        this.raycaster = new THREE.Raycaster();
        
        // Lighting
        this.setupLighting();
        
        // Stars background
        this.createStars();
    },
    
    /**
     * Setup scene lighting
     */
    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);
        
        // Sun light (directional)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(200, 100, 150);
        this.scene.add(sunLight);
        
        // Hemisphere light for better ambient
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x222222, 0.5);
        this.scene.add(hemiLight);
    },
    
    /**
     * Create star field background
     */
    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            // Random positions in a sphere
            const radius = 400 + Math.random() * 200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            sizeAttenuation: true
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    },
    
    /**
     * Initialize game modules
     */
    async initModules() {
        // Initialize Earth
        await Earth.init(this.scene);
        
        // Initialize Aircraft
        Aircraft.init(this.scene);
        
        // Initialize Airports
        await Airports.init(this.scene);
        
        // Initialize Camera controller
        Camera.init(this.camera);
        
        // Initialize Controls
        Controls.init();
        
        // Initialize HUD
        HUD.init();
        
        // Setup control callbacks
        Controls.onViewChange(() => {
            Camera.nextView();
        });
        
        Controls.onMenuOpen(() => {
            Airports.showMenu();
        });
        
        Controls.onStabilize(() => {
            Aircraft.stabilize();
        });
        
        // Setup orbit controls for pre-flight Earth exploration
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.orbitControls.enableDamping = true;
            this.orbitControls.dampingFactor = 0.05;
            this.orbitControls.minDistance = 110;
            this.orbitControls.maxDistance = 400;
        }
    },
    
    /**
     * Setup event listeners
     */
    setupEvents() {
        // Window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Mouse click for airport selection
        window.addEventListener('click', (e) => this.onClick(e));
        
        // Touch for airport selection
        window.addEventListener('touchend', (e) => this.onTouch(e));
        
        // Takeoff event
        window.addEventListener('takeoff', (e) => {
            this.isFlying = true;
            if (this.orbitControls) {
                this.orbitControls.enabled = false;
            }
        });
        
        // Focus airport event
        window.addEventListener('focusAirport', (e) => {
            if (!this.isFlying && this.orbitControls) {
                const position = e.detail.position;
                // Move camera to look at airport
                this.camera.position.copy(position.clone().normalize().multiplyScalar(150));
                this.orbitControls.target.copy(position);
                this.orbitControls.update();
            }
        });
        
        // Orientation change for mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.onResize(), 100);
        });
        
        // Check orientation on mobile
        if (Settings.isMobile()) {
            this.checkOrientation();
            window.addEventListener('resize', () => this.checkOrientation());
        }
    },
    
    /**
     * Handle window resize
     */
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },
    
    /**
     * Handle mouse click
     * @param {MouseEvent} e
     */
    onClick(e) {
        // Don't process if clicking on UI
        if (e.target.closest('.modal-overlay') || 
            e.target.closest('.hud') ||
            e.target.closest('.airport-info-panel') ||
            e.target.closest('.mobile-buttons') ||
            e.target.closest('.joystick-area')) {
            return;
        }
        
        // Only allow airport selection when not flying
        if (this.isFlying) return;
        
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for airport intersection
        Airports.checkIntersection(this.raycaster);
    },
    
    /**
     * Handle touch
     * @param {TouchEvent} e
     */
    onTouch(e) {
        // Don't process if touching UI elements
        if (e.target.closest('.modal-overlay') || 
            e.target.closest('.hud') ||
            e.target.closest('.airport-info-panel') ||
            e.target.closest('.mobile-buttons') ||
            e.target.closest('.joystick-area')) {
            return;
        }
        
        // Only allow airport selection when not flying
        if (this.isFlying) return;
        
        // Use changedTouches for touchend event
        if (e.changedTouches.length === 0) return;
        
        const touch = e.changedTouches[0];
        
        // Calculate touch position in normalized device coordinates
        this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for airport intersection
        Airports.checkIntersection(this.raycaster);
    },
    
    /**
     * Check device orientation for mobile
     */
    checkOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        const overlay = document.getElementById('orientation-overlay');
        
        if (isPortrait && Settings.isMobile()) {
            if (!overlay) {
                const div = document.createElement('div');
                div.id = 'orientation-overlay';
                div.className = 'orientation-overlay';
                div.innerHTML = `
                    <div class="orientation-message">
                        <span class="rotate-icon">📱</span>
                        <p data-i18n="rotateDevice">${I18n.t('rotateDevice')}</p>
                    </div>
                `;
                document.body.appendChild(div);
            }
        } else {
            if (overlay) {
                overlay.remove();
            }
        }
    },
    
    /**
     * Main animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.isPaused) return;
        
        const deltaTime = this.clock.getDelta();
        
        // Update controls input
        const input = Controls.update();
        
        if (this.isFlying) {
            // Apply input to aircraft
            Aircraft.setInput(input);
            
            // Update aircraft
            Aircraft.update(deltaTime);
            
            // Update camera to follow aircraft
            Camera.update(Aircraft, deltaTime);
            
            // Update day/night based on aircraft position
            const position = Aircraft.getPosition();
            const dayNightMode = Settings.get('dayNightMode');
            Earth.updateDayNight(position, dayNightMode);
            
            // Update HUD
            const state = Aircraft.getState();
            HUD.update({
                altitude: state.altitude,
                speed: state.speed,
                heading: state.heading,
                distance: Aircraft.getDistanceToDestination(),
                flightTime: Aircraft.getFlightTime()
            });
        } else {
            // Update orbit controls for Earth exploration
            if (this.orbitControls) {
                this.orbitControls.update();
            }
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    },
    
    /**
     * Show loading screen
     */
    showLoading() {
        const loading = document.createElement('div');
        loading.id = 'loading-screen';
        loading.className = 'loading-screen';
        loading.innerHTML = `
            <div class="loading-content">
                <h1>✈️ Sky Flight</h1>
                <div class="loading-bar">
                    <div class="loading-progress"></div>
                </div>
                <p>Loading...</p>
            </div>
        `;
        document.body.appendChild(loading);
    },
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            loading.classList.add('fade-out');
            setTimeout(() => loading.remove(), 500);
        }
    },
    
    /**
     * Show welcome UI
     */
    showWelcome() {
        const welcome = document.createElement('div');
        welcome.id = 'welcome-screen';
        welcome.className = 'welcome-screen';
        welcome.innerHTML = `
            <div class="welcome-content">
                <h1 data-i18n="gameTitle">${I18n.t('gameTitle')}</h1>
                <p class="welcome-subtitle">Web-based Flight Simulator</p>
                <div class="welcome-actions">
                    <button class="welcome-btn primary" onclick="Game.startGame()">
                        <span>🛫</span>
                        <span data-i18n="selectAirport">${I18n.t('selectAirport')}</span>
                    </button>
                    <button class="welcome-btn secondary" onclick="SettingsUI.show(); Game.hideWelcome();">
                        <span>⚙️</span>
                        <span data-i18n="settings">${I18n.t('settings')}</span>
                    </button>
                </div>
                <div class="welcome-controls">
                    <p class="controls-title" data-i18n="controls">${I18n.t('controls')}</p>
                    ${Settings.isMobile() ? `
                        <p>📱 Virtual joystick + buttons</p>
                    ` : `
                        <div class="controls-grid">
                            <span>W/↑</span><span data-i18n="pitchDown">${I18n.t('pitchDown')}</span>
                            <span>S/↓</span><span data-i18n="pitchUp">${I18n.t('pitchUp')}</span>
                            <span>A/←</span><span data-i18n="rollLeft">${I18n.t('rollLeft')}</span>
                            <span>D/→</span><span data-i18n="rollRight">${I18n.t('rollRight')}</span>
                            <span>Shift</span><span data-i18n="accelerate">${I18n.t('accelerate')}</span>
                            <span>V</span><span data-i18n="switchView">${I18n.t('switchView')}</span>
                        </div>
                    `}
                </div>
            </div>
        `;
        document.body.appendChild(welcome);
        
        setTimeout(() => {
            welcome.classList.add('visible');
        }, 100);
    },
    
    /**
     * Hide welcome screen
     */
    hideWelcome() {
        const welcome = document.getElementById('welcome-screen');
        if (welcome) {
            welcome.classList.remove('visible');
            setTimeout(() => welcome.remove(), 300);
        }
    },
    
    /**
     * Start game - show airport selection
     */
    startGame() {
        this.hideWelcome();
        Airports.showMenu();
    },
    
    /**
     * Pause game
     */
    pause() {
        this.isPaused = true;
    },
    
    /**
     * Resume game
     */
    resume() {
        this.isPaused = false;
    }
};

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init().catch(console.error);
});
