/**
 * Sky Flight - Audio Module
 * Manages game audio and sound effects
 */

const Audio = {
    context: null,
    masterGain: null,
    
    // Sound channels
    channels: {
        engine: null,
        wind: null,
        effects: null
    },
    
    // Engine sound oscillators
    engineSound: {
        oscillator: null,
        gain: null,
        baseFrequency: 80,
        isPlaying: false
    },
    
    // Wind sound
    windSound: {
        noise: null,
        gain: null,
        filter: null,
        isPlaying: false
    },
    
    // Settings
    settings: {
        masterVolume: 0.5,
        engineVolume: 0.3,
        windVolume: 0.2,
        effectsVolume: 0.5,
        enabled: true
    },
    
    /**
     * Initialize audio system
     */
    init() {
        // Check for Web Audio API support
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn('Web Audio API not supported');
            this.settings.enabled = false;
            return;
        }
        
        // Create audio context (will be resumed on user interaction)
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master gain
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = this.settings.masterVolume;
        this.masterGain.connect(this.context.destination);
        
        // Setup channels
        this.setupChannels();
        
        // Resume audio context on user interaction
        this.setupResumeOnInteraction();
        
        // Listen for flight events
        this.setupEventListeners();
    },
    
    /**
     * Setup audio channels
     */
    setupChannels() {
        // Engine channel
        this.channels.engine = this.context.createGain();
        this.channels.engine.gain.value = this.settings.engineVolume;
        this.channels.engine.connect(this.masterGain);
        
        // Wind channel
        this.channels.wind = this.context.createGain();
        this.channels.wind.gain.value = this.settings.windVolume;
        this.channels.wind.connect(this.masterGain);
        
        // Effects channel
        this.channels.effects = this.context.createGain();
        this.channels.effects.gain.value = this.settings.effectsVolume;
        this.channels.effects.connect(this.masterGain);
    },
    
    /**
     * Resume audio context on user interaction
     */
    setupResumeOnInteraction() {
        const resume = () => {
            if (this.context && this.context.state === 'suspended') {
                this.context.resume();
            }
        };
        
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('touchstart', resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });
    },
    
    /**
     * Setup event listeners for flight events
     */
    setupEventListeners() {
        window.addEventListener('takeoff', () => {
            this.startEngineSound();
            this.startWindSound();
        });
        
        window.addEventListener('flightPhaseChanged', (e) => {
            this.onFlightPhaseChanged(e.detail.phase);
        });
    },
    
    /**
     * Start engine sound
     */
    startEngineSound() {
        if (!this.settings.enabled || this.engineSound.isPlaying) return;
        if (!this.context || this.context.state === 'suspended') return;
        
        try {
            // Create oscillator for engine drone
            this.engineSound.oscillator = this.context.createOscillator();
            this.engineSound.oscillator.type = 'sawtooth';
            this.engineSound.oscillator.frequency.value = this.engineSound.baseFrequency;
            
            // Create gain for engine
            this.engineSound.gain = this.context.createGain();
            this.engineSound.gain.gain.value = 0;
            
            // Create low-pass filter for muffled engine sound
            const filter = this.context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 200;
            
            // Connect
            this.engineSound.oscillator.connect(filter);
            filter.connect(this.engineSound.gain);
            this.engineSound.gain.connect(this.channels.engine);
            
            // Start
            this.engineSound.oscillator.start();
            this.engineSound.isPlaying = true;
            
            // Fade in
            this.engineSound.gain.gain.setTargetAtTime(0.5, this.context.currentTime, 0.5);
        } catch (error) {
            console.warn('Failed to start engine sound:', error);
        }
    },
    
    /**
     * Stop engine sound
     */
    stopEngineSound() {
        if (!this.engineSound.isPlaying) return;
        
        try {
            // Fade out
            this.engineSound.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.3);
            
            // Stop after fade
            setTimeout(() => {
                if (this.engineSound.oscillator) {
                    this.engineSound.oscillator.stop();
                    this.engineSound.oscillator = null;
                }
                this.engineSound.isPlaying = false;
            }, 500);
        } catch (error) {
            this.engineSound.isPlaying = false;
        }
    },
    
    /**
     * Start wind sound (white noise)
     */
    startWindSound() {
        if (!this.settings.enabled || this.windSound.isPlaying) return;
        if (!this.context || this.context.state === 'suspended') return;
        
        try {
            // Create noise buffer
            const bufferSize = this.context.sampleRate * 2;
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.5;
            }
            
            // Create buffer source
            this.windSound.noise = this.context.createBufferSource();
            this.windSound.noise.buffer = buffer;
            this.windSound.noise.loop = true;
            
            // Create gain
            this.windSound.gain = this.context.createGain();
            this.windSound.gain.gain.value = 0;
            
            // Create band-pass filter for wind sound
            this.windSound.filter = this.context.createBiquadFilter();
            this.windSound.filter.type = 'bandpass';
            this.windSound.filter.frequency.value = 800;
            this.windSound.filter.Q.value = 0.5;
            
            // Connect
            this.windSound.noise.connect(this.windSound.filter);
            this.windSound.filter.connect(this.windSound.gain);
            this.windSound.gain.connect(this.channels.wind);
            
            // Start
            this.windSound.noise.start();
            this.windSound.isPlaying = true;
        } catch (error) {
            console.warn('Failed to start wind sound:', error);
        }
    },
    
    /**
     * Stop wind sound
     */
    stopWindSound() {
        if (!this.windSound.isPlaying) return;
        
        try {
            this.windSound.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.3);
            
            setTimeout(() => {
                if (this.windSound.noise) {
                    this.windSound.noise.stop();
                    this.windSound.noise = null;
                }
                this.windSound.isPlaying = false;
            }, 500);
        } catch (error) {
            this.windSound.isPlaying = false;
        }
    },
    
    /**
     * Update audio based on aircraft state
     * @param {Object} aircraft - Aircraft module
     * @param {number} deltaTime
     */
    update(aircraft, deltaTime) {
        if (!this.settings.enabled || !this.context) return;
        if (!aircraft || !aircraft.state.isFlying) return;
        
        const speed = aircraft.state.speed;
        const maxSpeed = aircraft.currentType.maxSpeed;
        const speedRatio = speed / maxSpeed;
        
        // Update engine pitch based on speed
        if (this.engineSound.isPlaying && this.engineSound.oscillator) {
            const targetFreq = this.engineSound.baseFrequency + speedRatio * 100;
            this.engineSound.oscillator.frequency.setTargetAtTime(
                targetFreq,
                this.context.currentTime,
                0.1
            );
        }
        
        // Update wind volume based on speed
        if (this.windSound.isPlaying && this.windSound.gain) {
            const windVolume = speedRatio * 0.5;
            this.windSound.gain.gain.setTargetAtTime(
                windVolume,
                this.context.currentTime,
                0.1
            );
            
            // Update wind filter frequency based on speed
            if (this.windSound.filter) {
                const filterFreq = 400 + speedRatio * 1200;
                this.windSound.filter.frequency.setTargetAtTime(
                    filterFreq,
                    this.context.currentTime,
                    0.1
                );
            }
        }
    },
    
    /**
     * Handle flight phase changes
     * @param {string} phase
     */
    onFlightPhaseChanged(phase) {
        if (!this.settings.enabled) return;
        
        switch (phase) {
            case 'taxiing':
                // Low engine idle
                if (this.engineSound.gain) {
                    this.engineSound.gain.gain.setTargetAtTime(0.2, this.context.currentTime, 0.5);
                }
                break;
                
            case 'takeoff_roll':
                // Increase engine volume
                if (this.engineSound.gain) {
                    this.engineSound.gain.gain.setTargetAtTime(0.7, this.context.currentTime, 0.3);
                }
                break;
                
            case 'climbing':
            case 'flying':
                // Normal engine volume
                if (this.engineSound.gain) {
                    this.engineSound.gain.gain.setTargetAtTime(0.5, this.context.currentTime, 0.5);
                }
                break;
        }
    },
    
    /**
     * Play notification sound
     * @param {string} type - 'success', 'warning', 'alert'
     */
    playNotification(type) {
        if (!this.settings.enabled || !this.context) return;
        if (this.context.state === 'suspended') return;
        
        try {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            
            oscillator.connect(gain);
            gain.connect(this.channels.effects);
            
            let frequency = 440;
            let duration = 0.2;
            
            switch (type) {
                case 'success':
                    frequency = 880;
                    break;
                case 'warning':
                    frequency = 440;
                    break;
                case 'alert':
                    frequency = 220;
                    duration = 0.5;
                    break;
            }
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gain.gain.setValueAtTime(0.3, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        } catch (error) {
            // Ignore notification sound errors
        }
    },
    
    /**
     * Set master volume
     * @param {number} volume - 0 to 1
     */
    setMasterVolume(volume) {
        // Use Math.max/min for compatibility without THREE dependency
        this.settings.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.settings.masterVolume;
        }
    },
    
    /**
     * Toggle audio on/off
     */
    toggle() {
        this.settings.enabled = !this.settings.enabled;
        
        if (!this.settings.enabled) {
            this.stopEngineSound();
            this.stopWindSound();
        }
        
        return this.settings.enabled;
    },
    
    /**
     * Check if audio is enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.settings.enabled;
    }
};
