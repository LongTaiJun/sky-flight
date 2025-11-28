/**
 * Sky Flight - HUD Module
 * Manages heads-up display interface
 */

const HUD = {
    elements: {},
    visible: false,
    
    /**
     * Initialize HUD
     */
    init() {
        this.createHUD();
        this.hide();
        
        // Listen for language changes
        window.addEventListener('languageChanged', () => {
            this.updateLabels();
        });
        
        // Listen for view changes
        window.addEventListener('viewChanged', (e) => {
            this.updateViewIndicator(e.detail.view);
        });
    },
    
    /**
     * Create HUD elements
     */
    createHUD() {
        // Main HUD container
        const hud = document.createElement('div');
        hud.id = 'hud';
        hud.className = 'hud';
        
        hud.innerHTML = `
            <!-- Top bar -->
            <div class="hud-top">
                <div class="hud-title">
                    <h1 data-i18n="gameTitle">${I18n.t('gameTitle')}</h1>
                </div>
                <div class="hud-controls">
                    <button class="hud-btn" id="btn-menu" onclick="Airports.showMenu()">
                        <span>📍</span>
                    </button>
                    <button class="hud-btn" id="btn-settings" onclick="SettingsUI.show()">
                        <span>⚙️</span>
                    </button>
                </div>
            </div>
            
            <!-- Compass -->
            <div class="hud-compass">
                <div class="compass-ring">
                    <div class="compass-arrow"></div>
                    <div class="compass-value" id="compass-value">N 0°</div>
                </div>
            </div>
            
            <!-- View indicator -->
            <div class="hud-view" id="hud-view">
                <span data-i18n="thirdPerson">${I18n.t('thirdPerson')}</span>
            </div>
            
            <!-- Flight phase indicator -->
            <div class="hud-flight-phase" id="hud-flight-phase">
                <span class="phase-value" id="phase-name">READY</span>
            </div>
            
            <!-- Attitude indicator -->
            <div class="hud-attitude" id="hud-attitude">
                <div class="attitude-horizon" id="attitude-horizon"></div>
                <div class="attitude-aircraft"></div>
                <div class="attitude-marker"></div>
            </div>
            
            <!-- Vertical speed indicator -->
            <div class="hud-vsi" id="hud-vsi">
                <span class="vsi-label">V/S</span>
                <span class="vsi-value" id="vsi-value">0</span>
                <span class="vsi-unit">m/s</span>
                <div class="vsi-indicator">
                    <div class="vsi-bar" id="vsi-bar"></div>
                </div>
            </div>
            
            <!-- Bottom info bar -->
            <div class="hud-bottom">
                <div class="hud-info-item">
                    <span class="info-label" data-i18n="altitude">${I18n.t('altitude')}</span>
                    <span class="info-value" id="hud-altitude">0 km</span>
                </div>
                <div class="hud-info-item">
                    <span class="info-label" data-i18n="speed">${I18n.t('speed')}</span>
                    <span class="info-value" id="hud-speed">0 km/h</span>
                </div>
                <div class="hud-info-item">
                    <span class="info-label" data-i18n="distance">${I18n.t('distance')}</span>
                    <span class="info-value" id="hud-distance">-- km</span>
                </div>
                <div class="hud-info-item">
                    <span class="info-label" data-i18n="flightTime">${I18n.t('flightTime')}</span>
                    <span class="info-value" id="hud-time">00:00</span>
                </div>
            </div>
            
            <!-- Destination indicator -->
            <div class="hud-destination" id="hud-destination">
                <span class="dest-label" data-i18n="destination">${I18n.t('destination')}</span>
                <span class="dest-value" id="dest-name" data-i18n="noDestination">${I18n.t('noDestination')}</span>
            </div>
            
            <!-- Speed lines container -->
            <div class="speed-lines" id="speed-lines"></div>
        `;
        
        document.body.appendChild(hud);
        
        // Store element references
        this.elements = {
            hud: hud,
            altitude: document.getElementById('hud-altitude'),
            speed: document.getElementById('hud-speed'),
            distance: document.getElementById('hud-distance'),
            time: document.getElementById('hud-time'),
            compass: document.getElementById('compass-value'),
            destination: document.getElementById('dest-name'),
            view: document.getElementById('hud-view'),
            flightPhase: document.getElementById('phase-name'),
            vsiValue: document.getElementById('vsi-value'),
            vsiBar: document.getElementById('vsi-bar'),
            attitudeHorizon: document.getElementById('attitude-horizon'),
            speedLines: document.getElementById('speed-lines')
        };
        
        // Initialize speed lines
        this.initSpeedLines();
        
        // Listen for flight phase changes
        window.addEventListener('flightPhaseChanged', (e) => {
            this.updateFlightPhase(e.detail.phase);
        });
    },
    
    /**
     * Initialize speed lines effect
     */
    initSpeedLines() {
        if (!this.elements.speedLines) return;
        
        for (let i = 0; i < 20; i++) {
            const line = document.createElement('div');
            line.className = 'speed-line';
            line.style.left = `${Math.random() * 100}%`;
            line.style.animationDelay = `${Math.random() * 0.5}s`;
            this.elements.speedLines.appendChild(line);
        }
    },
    
    /**
     * Update HUD with current flight data
     * @param {Object} data - Flight data
     */
    update(data) {
        if (!this.visible) return;
        
        // Altitude
        if (this.elements.altitude && data.altitude !== undefined) {
            this.elements.altitude.textContent = `${data.altitude.toFixed(1)} km`;
        }
        
        // Speed
        if (this.elements.speed && data.speed !== undefined) {
            this.elements.speed.textContent = `${Math.round(data.speed)} km/h`;
            
            // Update speed lines visibility based on speed
            this.updateSpeedLines(data.speed, data.maxSpeed || 1000);
        }
        
        // Vertical speed
        if (this.elements.vsiValue && data.verticalSpeed !== undefined) {
            // Convert from km/h to m/s (approx)
            const vsMs = Math.round(data.verticalSpeed * 1000 / 3600);
            const sign = vsMs > 0 ? '+' : '';
            this.elements.vsiValue.textContent = `${sign}${vsMs}`;
            
            // Update VSI bar
            if (this.elements.vsiBar) {
                const barHeight = Math.min(Math.abs(vsMs) / 50, 1) * 50;
                this.elements.vsiBar.style.height = `${barHeight}%`;
                this.elements.vsiBar.className = `vsi-bar ${vsMs > 0 ? 'climbing' : vsMs < 0 ? 'descending' : ''}`;
            }
        }
        
        // Pitch for attitude indicator
        if (this.elements.attitudeHorizon && data.pitch !== undefined) {
            // Map pitch (-90 to 90) to translate percentage
            const translateY = data.pitch * 0.5; // ±45% translation
            this.elements.attitudeHorizon.style.transform = `translateY(${translateY}%)`;
        }
        
        // Distance to destination
        if (this.elements.distance) {
            if (data.distance !== null && data.distance !== undefined) {
                this.elements.distance.textContent = `${Math.round(data.distance)} km`;
            } else {
                this.elements.distance.textContent = '-- km';
            }
        }
        
        // Flight time
        if (this.elements.time && data.flightTime !== undefined) {
            const minutes = Math.floor(data.flightTime / 60);
            const seconds = Math.floor(data.flightTime % 60);
            this.elements.time.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Heading/Compass
        if (this.elements.compass && data.heading !== undefined) {
            const heading = Math.round(data.heading);
            let direction = 'N';
            
            if (heading >= 337.5 || heading < 22.5) direction = 'N';
            else if (heading >= 22.5 && heading < 67.5) direction = 'NE';
            else if (heading >= 67.5 && heading < 112.5) direction = 'E';
            else if (heading >= 112.5 && heading < 157.5) direction = 'SE';
            else if (heading >= 157.5 && heading < 202.5) direction = 'S';
            else if (heading >= 202.5 && heading < 247.5) direction = 'SW';
            else if (heading >= 247.5 && heading < 292.5) direction = 'W';
            else if (heading >= 292.5 && heading < 337.5) direction = 'NW';
            
            this.elements.compass.textContent = `${direction} ${heading}°`;
            
            // Rotate compass arrow
            const arrow = document.querySelector('.compass-arrow');
            if (arrow) {
                arrow.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
            }
        }
    },
    
    /**
     * Update speed lines effect
     * @param {number} speed - Current speed
     * @param {number} maxSpeed - Maximum speed
     */
    updateSpeedLines(speed, maxSpeed) {
        if (!this.elements.speedLines) return;
        
        const speedRatio = speed / maxSpeed;
        
        // Show speed lines only at high speed (>50%)
        if (speedRatio > 0.5) {
            const opacity = (speedRatio - 0.5) * 2; // 0 at 50%, 1 at 100%
            this.elements.speedLines.style.opacity = opacity;
            this.elements.speedLines.classList.add('active');
        } else {
            this.elements.speedLines.classList.remove('active');
        }
    },
    
    /**
     * Update flight phase display
     * @param {string} phase
     */
    updateFlightPhase(phase) {
        if (!this.elements.flightPhase) return;
        
        const phaseNames = {
            'idle': 'READY',
            'taxiing': 'TAXIING',
            'takeoff_roll': 'TAKEOFF',
            'climbing': 'CLIMBING',
            'flying': 'CRUISING',
            'descending': 'DESCENDING',
            'landing': 'LANDING'
        };
        
        this.elements.flightPhase.textContent = phaseNames[phase] || phase.toUpperCase();
        this.elements.flightPhase.className = `phase-value phase-${phase}`;
    },
    
    /**
     * Update destination display
     * @param {Object} airport
     */
    updateDestination(airport) {
        if (this.elements.destination) {
            if (airport) {
                this.elements.destination.textContent = `${airport.iata} - ${airport.city}`;
                this.elements.destination.removeAttribute('data-i18n');
            } else {
                this.elements.destination.textContent = I18n.t('noDestination');
                this.elements.destination.setAttribute('data-i18n', 'noDestination');
            }
        }
    },
    
    /**
     * Update view indicator
     * @param {string} view
     */
    updateViewIndicator(view) {
        if (this.elements.view) {
            let key = 'thirdPerson';
            switch (view) {
                case 'thirdPerson':
                    key = 'thirdPerson';
                    break;
                case 'cockpit':
                    key = 'cockpit';
                    break;
                case 'overhead':
                    key = 'overhead';
                    break;
            }
            this.elements.view.innerHTML = `<span data-i18n="${key}">${I18n.t(key)}</span>`;
        }
    },
    
    /**
     * Update all labels for language change
     */
    updateLabels() {
        I18n.updateAllTexts();
    },
    
    /**
     * Show HUD
     */
    show() {
        this.visible = true;
        if (this.elements.hud) {
            this.elements.hud.classList.add('visible');
        }
    },
    
    /**
     * Hide HUD
     */
    hide() {
        this.visible = false;
        if (this.elements.hud) {
            this.elements.hud.classList.remove('visible');
        }
    },
    
    /**
     * Toggle HUD visibility
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    },
    
    /**
     * Show message notification
     * @param {string} message
     * @param {number} duration - Duration in ms
     */
    showMessage(message, duration = 3000) {
        // Remove existing message
        const existing = document.querySelector('.hud-message');
        if (existing) existing.remove();
        
        const messageEl = document.createElement('div');
        messageEl.className = 'hud-message';
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        requestAnimationFrame(() => {
            messageEl.classList.add('visible');
        });
        
        setTimeout(() => {
            messageEl.classList.remove('visible');
            setTimeout(() => messageEl.remove(), 300);
        }, duration);
    }
};


/**
 * Settings UI Module
 * Manages settings panel interface
 */
const SettingsUI = {
    /**
     * Show settings panel
     */
    show() {
        const existing = document.getElementById('settings-panel');
        if (existing) existing.remove();
        
        const panel = document.createElement('div');
        panel.id = 'settings-panel';
        panel.className = 'modal-overlay';
        
        const currentLang = I18n.getLanguage();
        const currentMode = Settings.get('dayNightMode');
        const currentControl = Settings.get('controlMode');
        const currentQuality = Settings.get('quality');
        
        panel.innerHTML = `
            <div class="modal-content settings-content">
                <div class="modal-header">
                    <h2 data-i18n="settings">${I18n.t('settings')}</h2>
                    <button class="close-btn" onclick="SettingsUI.hide()">×</button>
                </div>
                
                <div class="settings-section">
                    <label data-i18n="language">${I18n.t('language')}</label>
                    <div class="settings-options">
                        <button class="option-btn ${currentLang === 'en' ? 'active' : ''}" 
                                onclick="SettingsUI.setLanguage('en')">English</button>
                        <button class="option-btn ${currentLang === 'zh' ? 'active' : ''}" 
                                onclick="SettingsUI.setLanguage('zh')">中文</button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <label data-i18n="dayNightMode">${I18n.t('dayNightMode')}</label>
                    <div class="settings-options">
                        <button class="option-btn ${currentMode === 'auto' ? 'active' : ''}" 
                                onclick="SettingsUI.setDayNight('auto')" data-i18n="auto">${I18n.t('auto')}</button>
                        <button class="option-btn ${currentMode === 'day' ? 'active' : ''}" 
                                onclick="SettingsUI.setDayNight('day')" data-i18n="day">${I18n.t('day')}</button>
                        <button class="option-btn ${currentMode === 'night' ? 'active' : ''}" 
                                onclick="SettingsUI.setDayNight('night')" data-i18n="night">${I18n.t('night')}</button>
                    </div>
                </div>
                
                ${Settings.isMobile() ? `
                <div class="settings-section">
                    <label data-i18n="controlMode">${I18n.t('controlMode')}</label>
                    <div class="settings-options">
                        <button class="option-btn ${currentControl === 'joystick' ? 'active' : ''}" 
                                onclick="SettingsUI.setControlMode('joystick')" data-i18n="joystick">${I18n.t('joystick')}</button>
                        <button class="option-btn ${currentControl === 'gyroscope' ? 'active' : ''}" 
                                onclick="SettingsUI.setControlMode('gyroscope')" data-i18n="gyroscope">${I18n.t('gyroscope')}</button>
                    </div>
                </div>
                ` : ''}
                
                <div class="settings-section">
                    <label data-i18n="quality">${I18n.t('quality')}</label>
                    <div class="settings-options">
                        <button class="option-btn ${currentQuality === 'high' ? 'active' : ''}" 
                                onclick="SettingsUI.setQuality('high')" data-i18n="high">${I18n.t('high')}</button>
                        <button class="option-btn ${currentQuality === 'medium' ? 'active' : ''}" 
                                onclick="SettingsUI.setQuality('medium')" data-i18n="medium">${I18n.t('medium')}</button>
                        <button class="option-btn ${currentQuality === 'low' ? 'active' : ''}" 
                                onclick="SettingsUI.setQuality('low')" data-i18n="low">${I18n.t('low')}</button>
                    </div>
                </div>
                
                <button class="close-modal-btn" onclick="SettingsUI.hide()">
                    <span data-i18n="close">${I18n.t('close')}</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        requestAnimationFrame(() => {
            panel.classList.add('visible');
        });
    },
    
    /**
     * Hide settings panel
     */
    hide() {
        const panel = document.getElementById('settings-panel');
        if (panel) {
            panel.classList.remove('visible');
            setTimeout(() => panel.remove(), 300);
        }
    },
    
    /**
     * Set language
     * @param {string} lang
     */
    setLanguage(lang) {
        Settings.set('language', lang);
        I18n.setLanguage(lang);
        // Refresh panel to update active states
        this.show();
    },
    
    /**
     * Set day/night mode
     * @param {string} mode
     */
    setDayNight(mode) {
        Settings.set('dayNightMode', mode);
        this.updateActiveButton('dayNightMode', mode);
    },
    
    /**
     * Set control mode
     * @param {string} mode
     */
    setControlMode(mode) {
        Settings.set('controlMode', mode);
        this.updateActiveButton('controlMode', mode);
    },
    
    /**
     * Set quality
     * @param {string} quality
     */
    setQuality(quality) {
        Settings.set('quality', quality);
        this.updateActiveButton('quality', quality);
    },
    
    /**
     * Update active button state
     * @param {string} section
     * @param {string} value
     */
    updateActiveButton(section, value) {
        // Find the section by matching the setting name in onclick handlers
        const sections = document.querySelectorAll('.settings-section');
        sections.forEach(sectionEl => {
            const buttons = sectionEl.querySelectorAll('.option-btn');
            const sectionMatches = Array.from(buttons).some(btn => {
                const onclick = btn.getAttribute('onclick') || '';
                return onclick.includes(section);
            });
            
            if (sectionMatches) {
                // Remove active from all buttons in this section
                buttons.forEach(btn => btn.classList.remove('active'));
                // Add active to the matching button
                buttons.forEach(btn => {
                    const btnValue = btn.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
                    if (btnValue === value) {
                        btn.classList.add('active');
                    }
                });
            }
        });
    }
};
