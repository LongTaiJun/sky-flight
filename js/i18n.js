/**
 * Sky Flight - Internationalization Module
 * Supports Chinese and English languages
 */

const I18n = {
    currentLanguage: 'en',
    
    translations: {
        en: {
            // Game title
            gameTitle: 'Sky Flight',
            
            // Main menu
            selectAirport: 'Select Airport',
            settings: 'Settings',
            
            // Aircraft types
            cessna: 'Cessna',
            cessnaDesc: 'Private Plane - Speed: 300 km/h, Easy handling',
            airliner: 'Airliner',
            airlinerDesc: 'Commercial Plane - Speed: 850 km/h, Medium handling',
            jet: 'Jet',
            jetDesc: 'Jet Fighter - Speed: 1500 km/h, Sensitive handling',
            
            // Airport info
            airportInfo: 'Airport Info',
            city: 'City',
            country: 'Country',
            icaoCode: 'ICAO',
            iataCode: 'IATA',
            takeoffFromHere: 'Takeoff from here',
            setAsDestination: 'Set as destination',
            
            // HUD
            altitude: 'ALT',
            speed: 'SPD',
            heading: 'HDG',
            distance: 'DIST',
            flightTime: 'TIME',
            destination: 'DEST',
            noDestination: 'No destination',
            
            // Settings
            language: 'Language',
            dayNightMode: 'Day/Night Mode',
            auto: 'Auto',
            day: 'Day',
            night: 'Night',
            controlMode: 'Control Mode',
            joystick: 'Joystick',
            gyroscope: 'Gyroscope',
            quality: 'Graphics Quality',
            high: 'High',
            medium: 'Medium',
            low: 'Low',
            close: 'Close',
            
            // Views
            thirdPerson: 'Third Person View',
            cockpit: 'Cockpit View',
            overhead: 'Overhead View',
            
            // Controls help
            controls: 'Controls',
            pitchDown: 'Pitch Down',
            pitchUp: 'Pitch Up',
            rollLeft: 'Roll Left',
            rollRight: 'Roll Right',
            yawLeft: 'Yaw Left',
            yawRight: 'Yaw Right',
            accelerate: 'Accelerate',
            decelerate: 'Decelerate',
            stabilize: 'Stabilize',
            switchView: 'Switch View',
            openMenu: 'Open Menu',
            
            // Messages
            rotateDevice: 'Please rotate your device to landscape mode',
            selectAircraftFirst: 'Please select an aircraft first',
            takeoffSuccess: 'Takeoff successful!',
            arrivedAtDestination: 'Arrived at destination!',
            
            // Aircraft selection
            selectAircraft: 'Select Aircraft',
            
            // Search
            searchAirport: 'Search airport...',
        },
        zh: {
            // Game title
            gameTitle: '天际飞行',
            
            // Main menu
            selectAirport: '选择机场',
            settings: '设置',
            
            // Aircraft types
            cessna: '塞斯纳',
            cessnaDesc: '私人飞机 - 速度: 300 km/h, 简单操控',
            airliner: '客机',
            airlinerDesc: '商用客机 - 速度: 850 km/h, 中等操控',
            jet: '喷气机',
            jetDesc: '喷气式战斗机 - 速度: 1500 km/h, 灵敏操控',
            
            // Airport info
            airportInfo: '机场信息',
            city: '城市',
            country: '国家',
            icaoCode: 'ICAO代码',
            iataCode: 'IATA代码',
            takeoffFromHere: '从这里起飞',
            setAsDestination: '设为目的地',
            
            // HUD
            altitude: '高度',
            speed: '速度',
            heading: '航向',
            distance: '距离',
            flightTime: '时间',
            destination: '目的地',
            noDestination: '无目的地',
            
            // Settings
            language: '语言',
            dayNightMode: '昼夜模式',
            auto: '自动',
            day: '白天',
            night: '夜晚',
            controlMode: '控制方式',
            joystick: '摇杆',
            gyroscope: '陀螺仪',
            quality: '画质设置',
            high: '高',
            medium: '中',
            low: '低',
            close: '关闭',
            
            // Views
            thirdPerson: '第三人称视角',
            cockpit: '驾驶舱视角',
            overhead: '俯瞰视角',
            
            // Controls help
            controls: '控制说明',
            pitchDown: '俯冲',
            pitchUp: '拉升',
            rollLeft: '左翻滚',
            rollRight: '右翻滚',
            yawLeft: '左偏航',
            yawRight: '右偏航',
            accelerate: '加速',
            decelerate: '减速',
            stabilize: '稳定飞机',
            switchView: '切换视角',
            openMenu: '打开菜单',
            
            // Messages
            rotateDevice: '请将设备横屏以获得最佳体验',
            selectAircraftFirst: '请先选择飞机',
            takeoffSuccess: '起飞成功！',
            arrivedAtDestination: '已到达目的地！',
            
            // Aircraft selection
            selectAircraft: '选择飞机',
            
            // Search
            searchAirport: '搜索机场...',
        }
    },
    
    /**
     * Initialize i18n based on browser language
     */
    init() {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('zh')) {
            this.currentLanguage = 'zh';
        } else {
            this.currentLanguage = 'en';
        }
        
        // Check localStorage for saved preference
        const savedLang = localStorage.getItem('skyFlight_language');
        if (savedLang && this.translations[savedLang]) {
            this.currentLanguage = savedLang;
        }
    },
    
    /**
     * Set current language
     * @param {string} lang - Language code ('en' or 'zh')
     */
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('skyFlight_language', lang);
            this.updateAllTexts();
        }
    },
    
    /**
     * Get translation for a key
     * @param {string} key - Translation key
     * @returns {string} Translated text
     */
    t(key) {
        const translation = this.translations[this.currentLanguage];
        return translation[key] || this.translations['en'][key] || key;
    },
    
    /**
     * Update all texts in the DOM with data-i18n attribute
     */
    updateAllTexts() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // Dispatch event for custom updates
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: this.currentLanguage } 
        }));
    },
    
    /**
     * Get current language
     * @returns {string} Current language code
     */
    getLanguage() {
        return this.currentLanguage;
    }
};

// Initialize on load
I18n.init();
