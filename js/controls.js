/**
 * Sky Flight - Controls Module
 * Handles keyboard, touch, and gyroscope input
 */

const Controls = {
    // Input state
    keys: {},
    touches: {},
    gyro: { alpha: 0, beta: 0, gamma: 0 },
    
    // Virtual joystick
    joystick: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        element: null,
        knob: null
    },
    
    // Control output
    output: {
        pitch: 0,
        roll: 0,
        yaw: 0,
        throttle: 0
    },
    
    // Callbacks
    callbacks: {
        onViewChange: null,
        onMenuOpen: null,
        onStabilize: null
    },
    
    /**
     * Initialize controls
     */
    init() {
        this.setupKeyboardControls();
        
        if (Settings.isMobile()) {
            this.setupTouchControls();
            this.createVirtualJoystick();
            this.createMobileButtons();
            
            if (Settings.get('controlMode') === 'gyroscope') {
                this.setupGyroscopeControls();
            }
        }
        
        // Listen for settings changes
        window.addEventListener('settingChanged', (e) => {
            if (e.detail.key === 'controlMode') {
                if (e.detail.value === 'gyroscope') {
                    this.setupGyroscopeControls();
                }
            }
        });
    },
    
    /**
     * Setup keyboard controls
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle special keys
            switch (e.code) {
                case 'KeyV':
                    if (this.callbacks.onViewChange) {
                        this.callbacks.onViewChange();
                    }
                    break;
                case 'KeyM':
                    if (this.callbacks.onMenuOpen) {
                        this.callbacks.onMenuOpen();
                    }
                    break;
                case 'Space':
                    if (this.callbacks.onStabilize) {
                        this.callbacks.onStabilize();
                    }
                    break;
            }
            
            // Prevent default for game controls
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Reset keys on blur
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    },
    
    /**
     * Setup touch controls
     */
    setupTouchControls() {
        // Handle two-finger tap for view change
        let touchCount = 0;
        let lastTapTime = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchCount = e.touches.length;
            
            if (touchCount === 2) {
                const now = Date.now();
                if (now - lastTapTime < 300) {
                    if (this.callbacks.onViewChange) {
                        this.callbacks.onViewChange();
                    }
                }
                lastTapTime = now;
            }
        });
        
        document.addEventListener('touchend', () => {
            touchCount = 0;
        });
    },
    
    /**
     * Create virtual joystick for mobile
     */
    createVirtualJoystick() {
        // Joystick container
        const container = document.createElement('div');
        container.id = 'joystick-container';
        container.className = 'joystick-area';
        
        // Joystick base
        const base = document.createElement('div');
        base.id = 'joystick-base';
        base.className = 'joystick-base';
        
        // Joystick knob
        const knob = document.createElement('div');
        knob.id = 'joystick-knob';
        knob.className = 'joystick-knob';
        
        base.appendChild(knob);
        container.appendChild(base);
        document.body.appendChild(container);
        
        this.joystick.element = base;
        this.joystick.knob = knob;
        
        // Touch events for joystick
        container.addEventListener('touchstart', (e) => this.handleJoystickStart(e));
        container.addEventListener('touchmove', (e) => this.handleJoystickMove(e));
        container.addEventListener('touchend', (e) => this.handleJoystickEnd(e));
    },
    
    /**
     * Handle joystick touch start
     */
    handleJoystickStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.joystick.element.getBoundingClientRect();
        
        this.joystick.active = true;
        this.joystick.startX = rect.left + rect.width / 2;
        this.joystick.startY = rect.top + rect.height / 2;
        this.joystick.currentX = touch.clientX;
        this.joystick.currentY = touch.clientY;
        
        this.updateJoystickPosition();
    },
    
    /**
     * Handle joystick touch move
     */
    handleJoystickMove(e) {
        if (!this.joystick.active) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        this.joystick.currentX = touch.clientX;
        this.joystick.currentY = touch.clientY;
        
        this.updateJoystickPosition();
    },
    
    /**
     * Handle joystick touch end
     */
    handleJoystickEnd(e) {
        e.preventDefault();
        this.joystick.active = false;
        this.joystick.knob.style.transform = 'translate(-50%, -50%)';
        this.output.pitch = 0;
        this.output.roll = 0;
    },
    
    /**
     * Update joystick knob position
     */
    updateJoystickPosition() {
        const maxDistance = 40;
        
        let dx = this.joystick.currentX - this.joystick.startX;
        let dy = this.joystick.currentY - this.joystick.startY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxDistance) {
            dx = dx / distance * maxDistance;
            dy = dy / distance * maxDistance;
        }
        
        this.joystick.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        // Map to control output (-1 to 1)
        this.output.roll = dx / maxDistance;
        this.output.pitch = dy / maxDistance;
    },
    
    /**
     * Create mobile control buttons
     */
    createMobileButtons() {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'mobile-buttons';
        buttonsContainer.className = 'mobile-buttons';
        
        // Accelerate button
        const accelBtn = document.createElement('button');
        accelBtn.className = 'mobile-btn accel-btn';
        accelBtn.innerHTML = '▲<br>SPD';
        accelBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.output.throttle = 1;
        });
        accelBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.output.throttle = 0;
        });
        
        // Decelerate button
        const decelBtn = document.createElement('button');
        decelBtn.className = 'mobile-btn decel-btn';
        decelBtn.innerHTML = '▼<br>SPD';
        decelBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.output.throttle = -1;
        });
        decelBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.output.throttle = 0;
        });
        
        // Stabilize button
        const stabilizeBtn = document.createElement('button');
        stabilizeBtn.className = 'mobile-btn stabilize-btn';
        stabilizeBtn.innerHTML = '⊙';
        stabilizeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.callbacks.onStabilize) {
                this.callbacks.onStabilize();
            }
        });
        
        buttonsContainer.appendChild(accelBtn);
        buttonsContainer.appendChild(stabilizeBtn);
        buttonsContainer.appendChild(decelBtn);
        document.body.appendChild(buttonsContainer);
    },
    
    /**
     * Setup gyroscope controls
     */
    async setupGyroscopeControls() {
        // Request permission on iOS
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission !== 'granted') {
                    console.warn('Gyroscope permission denied');
                    return;
                }
            } catch (error) {
                console.error('Error requesting gyroscope permission:', error);
                return;
            }
        }
        
        window.addEventListener('deviceorientation', (e) => {
            this.gyro.alpha = e.alpha || 0;
            this.gyro.beta = e.beta || 0;
            this.gyro.gamma = e.gamma || 0;
        });
    },
    
    /**
     * Update controls and get current input
     * @returns {Object} Control output
     */
    update() {
        // Reset output for keyboard
        if (!Settings.isMobile()) {
            this.output.pitch = 0;
            this.output.roll = 0;
            this.output.yaw = 0;
            this.output.throttle = 0;
            
            // Pitch
            if (this.keys['KeyW'] || this.keys['ArrowUp']) {
                this.output.pitch = 1;
            }
            if (this.keys['KeyS'] || this.keys['ArrowDown']) {
                this.output.pitch = -1;
            }
            
            // Roll
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
                this.output.roll = -1;
            }
            if (this.keys['KeyD'] || this.keys['ArrowRight']) {
                this.output.roll = 1;
            }
            
            // Yaw
            if (this.keys['KeyQ']) {
                this.output.yaw = -1;
            }
            if (this.keys['KeyE']) {
                this.output.yaw = 1;
            }
            
            // Throttle
            if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
                this.output.throttle = 1;
            }
            if (this.keys['ControlLeft'] || this.keys['ControlRight']) {
                this.output.throttle = -1;
            }
        } else if (Settings.get('controlMode') === 'gyroscope') {
            // Gyroscope controls (phone orientation)
            // Beta = pitch (front/back tilt)
            // Gamma = roll (left/right tilt)
            this.output.pitch = THREE.MathUtils.clamp(this.gyro.beta / 30, -1, 1);
            this.output.roll = THREE.MathUtils.clamp(this.gyro.gamma / 30, -1, 1);
        }
        // Joystick output is already set in handleJoystickMove
        
        return this.output;
    },
    
    /**
     * Set callback for view change
     * @param {Function} callback
     */
    onViewChange(callback) {
        this.callbacks.onViewChange = callback;
    },
    
    /**
     * Set callback for menu open
     * @param {Function} callback
     */
    onMenuOpen(callback) {
        this.callbacks.onMenuOpen = callback;
    },
    
    /**
     * Set callback for stabilize
     * @param {Function} callback
     */
    onStabilize(callback) {
        this.callbacks.onStabilize = callback;
    },
    
    /**
     * Show or hide mobile controls
     * @param {boolean} show
     */
    showMobileControls(show) {
        const joystick = document.getElementById('joystick-container');
        const buttons = document.getElementById('mobile-buttons');
        
        if (joystick) joystick.style.display = show ? 'block' : 'none';
        if (buttons) buttons.style.display = show ? 'flex' : 'none';
    }
};
