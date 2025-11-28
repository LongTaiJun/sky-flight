/**
 * Sky Flight - Settings Module
 * Manages game settings and preferences
 */

const Settings = {
    defaults: {
        language: 'en',
        dayNightMode: 'auto', // 'auto', 'day', 'night'
        controlMode: 'joystick', // 'joystick', 'gyroscope'
        quality: 'high', // 'high', 'medium', 'low'
        soundEnabled: true,
        musicVolume: 0.5,
        sfxVolume: 0.7
    },
    
    current: {},
    
    /**
     * Initialize settings from localStorage or defaults
     */
    init() {
        const saved = localStorage.getItem('skyFlight_settings');
        if (saved) {
            try {
                this.current = { ...this.defaults, ...JSON.parse(saved) };
            } catch (e) {
                this.current = { ...this.defaults };
            }
        } else {
            this.current = { ...this.defaults };
        }
        
        // Apply initial settings
        this.applyQualitySettings();
    },
    
    /**
     * Get a setting value
     * @param {string} key - Setting key
     * @returns {*} Setting value
     */
    get(key) {
        return this.current[key] !== undefined ? this.current[key] : this.defaults[key];
    },
    
    /**
     * Set a setting value
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    set(key, value) {
        this.current[key] = value;
        this.save();
        
        // Apply specific settings immediately
        if (key === 'quality') {
            this.applyQualitySettings();
        }
        if (key === 'language') {
            I18n.setLanguage(value);
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('settingChanged', {
            detail: { key, value }
        }));
    },
    
    /**
     * Save settings to localStorage
     */
    save() {
        localStorage.setItem('skyFlight_settings', JSON.stringify(this.current));
    },
    
    /**
     * Reset settings to defaults
     */
    reset() {
        this.current = { ...this.defaults };
        this.save();
        this.applyQualitySettings();
    },
    
    /**
     * Apply quality settings to the renderer
     */
    applyQualitySettings() {
        const quality = this.get('quality');
        
        // These will be used by the renderer
        switch (quality) {
            case 'high':
                this.qualityConfig = {
                    pixelRatio: window.devicePixelRatio,
                    shadowMapEnabled: true,
                    antialias: true,
                    textureQuality: 1
                };
                break;
            case 'medium':
                this.qualityConfig = {
                    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
                    shadowMapEnabled: true,
                    antialias: true,
                    textureQuality: 0.75
                };
                break;
            case 'low':
                this.qualityConfig = {
                    pixelRatio: 1,
                    shadowMapEnabled: false,
                    antialias: false,
                    textureQuality: 0.5
                };
                break;
        }
    },
    
    /**
     * Get quality configuration
     * @returns {Object} Quality configuration
     */
    getQualityConfig() {
        return this.qualityConfig || this.defaults.qualityConfig;
    },
    
    /**
     * Check if device is mobile
     * @returns {boolean}
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    /**
     * Check if device supports gyroscope
     * @returns {Promise<boolean>}
     */
    async hasGyroscope() {
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requires permission
            return true;
        }
        return 'DeviceOrientationEvent' in window;
    }
};

// Initialize on load
Settings.init();
