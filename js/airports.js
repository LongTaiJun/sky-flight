/**
 * Sky Flight - Airports Module
 * Manages airport markers and interactions
 */

const Airports = {
    data: [],
    markers: [],
    group: null,
    selectedAirport: null,
    destinationAirport: null,
    
    // Marker settings
    markerSettings: {
        radius: 0.3,
        height: 0.5,
        color: 0x00ff88,
        selectedColor: 0xffff00,
        destinationColor: 0xff4444
    },
    
    /**
     * Initialize airports
     * @param {THREE.Scene} scene
     * @returns {Promise}
     */
    async init(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        
        // Load airport data
        await this.loadData();
        
        // Create markers
        this.createMarkers();
        
        scene.add(this.group);
        
        return this.group;
    },
    
    /**
     * Load airport data from JSON
     */
    async loadData() {
        try {
            const response = await fetch('data/airports.json');
            this.data = await response.json();
        } catch (error) {
            console.error('Failed to load airport data:', error);
            this.data = [];
        }
    },
    
    /**
     * Create 3D markers for all airports
     */
    createMarkers() {
        const markerGeometry = new THREE.ConeGeometry(
            this.markerSettings.radius,
            this.markerSettings.height,
            6
        );
        
        const markerMaterial = new THREE.MeshPhongMaterial({
            color: this.markerSettings.color,
            emissive: this.markerSettings.color,
            emissiveIntensity: 0.3
        });
        
        this.data.forEach((airport, index) => {
            const marker = new THREE.Mesh(
                markerGeometry.clone(),
                markerMaterial.clone()
            );
            
            // Position marker on Earth surface
            const position = Earth.latLonToVector3(airport.lat, airport.lon, 0.3);
            marker.position.copy(position);
            
            // Orient marker to point outward from Earth
            marker.lookAt(new THREE.Vector3(0, 0, 0));
            marker.rotateX(Math.PI / 2);
            
            // Store airport data on marker
            marker.userData = {
                index: index,
                airport: airport,
                isAirport: true
            };
            
            this.markers.push(marker);
            this.group.add(marker);
        });
    },
    
    /**
     * Handle click on airport marker
     * @param {THREE.Mesh} marker
     */
    selectAirport(marker) {
        const airport = marker.userData.airport;
        
        // Reset previous selection
        if (this.selectedAirport) {
            const prevMarker = this.markers[this.selectedAirport.index];
            if (prevMarker && prevMarker !== marker) {
                prevMarker.material.color.setHex(
                    this.destinationAirport && this.destinationAirport.icao === this.selectedAirport.icao
                        ? this.markerSettings.destinationColor
                        : this.markerSettings.color
                );
                prevMarker.material.emissive.setHex(
                    this.destinationAirport && this.destinationAirport.icao === this.selectedAirport.icao
                        ? this.markerSettings.destinationColor
                        : this.markerSettings.color
                );
            }
        }
        
        // Highlight selected marker
        marker.material.color.setHex(this.markerSettings.selectedColor);
        marker.material.emissive.setHex(this.markerSettings.selectedColor);
        
        this.selectedAirport = { ...airport, index: marker.userData.index };
        
        // Show airport info panel
        this.showAirportInfo(airport);
        
        return airport;
    },
    
    /**
     * Show airport information panel
     * @param {Object} airport
     */
    showAirportInfo(airport) {
        // Remove existing panel
        const existingPanel = document.getElementById('airport-info-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        // Create panel
        const panel = document.createElement('div');
        panel.id = 'airport-info-panel';
        panel.className = 'airport-info-panel';
        
        panel.innerHTML = `
            <div class="airport-info-header">
                <h3>${airport.name}</h3>
                <button class="close-btn" onclick="Airports.hideAirportInfo()">×</button>
            </div>
            <div class="airport-info-content">
                <div class="info-row">
                    <span class="info-label" data-i18n="city">${I18n.t('city')}</span>
                    <span class="info-value">${airport.city}</span>
                </div>
                <div class="info-row">
                    <span class="info-label" data-i18n="country">${I18n.t('country')}</span>
                    <span class="info-value">${airport.country}</span>
                </div>
                <div class="info-row">
                    <span class="info-label" data-i18n="iataCode">${I18n.t('iataCode')}</span>
                    <span class="info-value">${airport.iata}</span>
                </div>
                <div class="info-row">
                    <span class="info-label" data-i18n="icaoCode">${I18n.t('icaoCode')}</span>
                    <span class="info-value">${airport.icao}</span>
                </div>
            </div>
            <div class="airport-info-actions">
                <button class="action-btn primary" onclick="Airports.takeoffFrom('${airport.icao}')">
                    <span data-i18n="takeoffFromHere">${I18n.t('takeoffFromHere')}</span>
                </button>
                <button class="action-btn secondary" onclick="Airports.setAsDestination('${airport.icao}')">
                    <span data-i18n="setAsDestination">${I18n.t('setAsDestination')}</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Animate in
        requestAnimationFrame(() => {
            panel.classList.add('visible');
        });
    },
    
    /**
     * Hide airport info panel
     */
    hideAirportInfo() {
        const panel = document.getElementById('airport-info-panel');
        if (panel) {
            panel.classList.remove('visible');
            setTimeout(() => panel.remove(), 300);
        }
    },
    
    /**
     * Takeoff from specified airport
     * @param {string} icao - ICAO code
     */
    takeoffFrom(icao) {
        const airport = this.data.find(a => a.icao === icao);
        if (!airport) return;
        
        // Hide panel
        this.hideAirportInfo();
        
        // Check if aircraft type is selected
        if (!Aircraft.currentType) {
            this.showAircraftSelection(airport);
            return;
        }
        
        // Takeoff
        Aircraft.takeoff(airport);
        
        // Show HUD
        HUD.show();
        
        // Switch camera to follow
        Camera.setView('thirdPerson', true);
        
        // Show mobile controls if on mobile
        if (Settings.isMobile()) {
            Controls.showMobileControls(true);
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('takeoff', {
            detail: { airport }
        }));
    },
    
    /**
     * Show aircraft selection dialog
     * @param {Object} airport
     */
    showAircraftSelection(airport) {
        const existingDialog = document.getElementById('aircraft-selection');
        if (existingDialog) existingDialog.remove();
        
        const dialog = document.createElement('div');
        dialog.id = 'aircraft-selection';
        dialog.className = 'modal-overlay';
        
        dialog.innerHTML = `
            <div class="modal-content">
                <h2 data-i18n="selectAircraft">${I18n.t('selectAircraft')}</h2>
                <div class="aircraft-options">
                    <div class="aircraft-option" onclick="Airports.selectAircraftAndTakeoff('cessna', '${airport.icao}')">
                        <span class="aircraft-emoji">🛩️</span>
                        <span class="aircraft-name" data-i18n="cessna">${I18n.t('cessna')}</span>
                        <span class="aircraft-desc" data-i18n="cessnaDesc">${I18n.t('cessnaDesc')}</span>
                    </div>
                    <div class="aircraft-option" onclick="Airports.selectAircraftAndTakeoff('airliner', '${airport.icao}')">
                        <span class="aircraft-emoji">✈️</span>
                        <span class="aircraft-name" data-i18n="airliner">${I18n.t('airliner')}</span>
                        <span class="aircraft-desc" data-i18n="airlinerDesc">${I18n.t('airlinerDesc')}</span>
                    </div>
                    <div class="aircraft-option" onclick="Airports.selectAircraftAndTakeoff('jet', '${airport.icao}')">
                        <span class="aircraft-emoji">🛫</span>
                        <span class="aircraft-name" data-i18n="jet">${I18n.t('jet')}</span>
                        <span class="aircraft-desc" data-i18n="jetDesc">${I18n.t('jetDesc')}</span>
                    </div>
                </div>
                <button class="close-modal-btn" onclick="document.getElementById('aircraft-selection').remove()">
                    <span data-i18n="close">${I18n.t('close')}</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        requestAnimationFrame(() => {
            dialog.classList.add('visible');
        });
    },
    
    /**
     * Select aircraft and takeoff
     * @param {string} type - Aircraft type
     * @param {string} icao - Airport ICAO code
     */
    selectAircraftAndTakeoff(type, icao) {
        // Remove dialog
        const dialog = document.getElementById('aircraft-selection');
        if (dialog) dialog.remove();
        
        // Set aircraft type
        Aircraft.setType(type);
        
        // Takeoff
        this.takeoffFrom(icao);
    },
    
    /**
     * Set airport as destination
     * @param {string} icao - ICAO code
     */
    setAsDestination(icao) {
        const airport = this.data.find(a => a.icao === icao);
        if (!airport) return;
        
        // Reset previous destination marker
        if (this.destinationAirport) {
            const prevIndex = this.data.findIndex(a => a.icao === this.destinationAirport.icao);
            if (prevIndex >= 0 && this.markers[prevIndex]) {
                this.markers[prevIndex].material.color.setHex(this.markerSettings.color);
                this.markers[prevIndex].material.emissive.setHex(this.markerSettings.color);
            }
        }
        
        // Highlight destination marker
        const index = this.data.findIndex(a => a.icao === icao);
        if (index >= 0 && this.markers[index]) {
            this.markers[index].material.color.setHex(this.markerSettings.destinationColor);
            this.markers[index].material.emissive.setHex(this.markerSettings.destinationColor);
        }
        
        this.destinationAirport = airport;
        Aircraft.setDestination(airport);
        
        // Hide panel
        this.hideAirportInfo();
        
        // Update HUD
        HUD.updateDestination(airport);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('destinationSet', {
            detail: { airport }
        }));
    },
    
    /**
     * Get all airports
     * @returns {Array}
     */
    getAll() {
        return this.data;
    },
    
    /**
     * Search airports
     * @param {string} query
     * @returns {Array}
     */
    search(query) {
        if (!query) return this.data;
        
        const lowerQuery = query.toLowerCase();
        return this.data.filter(airport => 
            airport.name.toLowerCase().includes(lowerQuery) ||
            airport.city.toLowerCase().includes(lowerQuery) ||
            airport.country.toLowerCase().includes(lowerQuery) ||
            airport.iata.toLowerCase().includes(lowerQuery) ||
            airport.icao.toLowerCase().includes(lowerQuery)
        );
    },
    
    /**
     * Raycast to find airport under mouse/touch
     * @param {THREE.Raycaster} raycaster
     * @returns {Object|null} Airport data or null
     */
    checkIntersection(raycaster) {
        const intersects = raycaster.intersectObjects(this.markers);
        
        if (intersects.length > 0) {
            const marker = intersects[0].object;
            if (marker.userData.isAirport) {
                return this.selectAirport(marker);
            }
        }
        
        return null;
    },
    
    /**
     * Show airport selection menu
     */
    showMenu() {
        const existingMenu = document.getElementById('airport-menu');
        if (existingMenu) existingMenu.remove();
        
        const menu = document.createElement('div');
        menu.id = 'airport-menu';
        menu.className = 'modal-overlay';
        
        let airportListHTML = this.data.map(airport => `
            <div class="airport-list-item" onclick="Airports.selectFromMenu('${airport.icao}')">
                <span class="airport-code">${airport.iata}</span>
                <span class="airport-name">${airport.name}</span>
                <span class="airport-city">${airport.city}, ${airport.country}</span>
            </div>
        `).join('');
        
        menu.innerHTML = `
            <div class="modal-content airport-menu-content">
                <div class="modal-header">
                    <h2 data-i18n="selectAirport">${I18n.t('selectAirport')}</h2>
                    <button class="close-btn" onclick="Airports.hideMenu()">×</button>
                </div>
                <input type="text" 
                       id="airport-search" 
                       class="airport-search" 
                       placeholder="${I18n.t('searchAirport')}"
                       data-i18n-placeholder="searchAirport"
                       oninput="Airports.filterMenu(this.value)">
                <div class="airport-list" id="airport-list">
                    ${airportListHTML}
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        requestAnimationFrame(() => {
            menu.classList.add('visible');
            document.getElementById('airport-search').focus();
        });
    },
    
    /**
     * Hide airport menu
     */
    hideMenu() {
        const menu = document.getElementById('airport-menu');
        if (menu) {
            menu.classList.remove('visible');
            setTimeout(() => menu.remove(), 300);
        }
    },
    
    /**
     * Filter airport menu by search query
     * @param {string} query
     */
    filterMenu(query) {
        const filtered = this.search(query);
        const listContainer = document.getElementById('airport-list');
        
        if (listContainer) {
            listContainer.innerHTML = filtered.map(airport => `
                <div class="airport-list-item" onclick="Airports.selectFromMenu('${airport.icao}')">
                    <span class="airport-code">${airport.iata}</span>
                    <span class="airport-name">${airport.name}</span>
                    <span class="airport-city">${airport.city}, ${airport.country}</span>
                </div>
            `).join('');
        }
    },
    
    /**
     * Select airport from menu
     * @param {string} icao
     */
    selectFromMenu(icao) {
        this.hideMenu();
        
        const airport = this.data.find(a => a.icao === icao);
        const index = this.data.findIndex(a => a.icao === icao);
        
        if (airport && this.markers[index]) {
            this.selectAirport(this.markers[index]);
            
            // Move camera to look at airport
            const position = Earth.latLonToVector3(airport.lat, airport.lon, 0);
            // This will be handled by main.js camera logic
            window.dispatchEvent(new CustomEvent('focusAirport', {
                detail: { position, airport }
            }));
        }
    },
    
    /**
     * Get markers group
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.group;
    }
};
