// Theme Configuration System
// Defines all available themes with their ball styles and color schemes

const THEMES = {
    default: {
        name: 'Default',
        icon: '🎰',
        description: 'Classic gold and green theme',
        colors: {
            primary: '#FFD700',
            primaryDark: '#B8860B',
            secondary: '#14F195',
            background: '#0F0F0F',
            cardBg: '#1A1A1A',
            border: '#2A2A2A',
            text: '#FFFFFF',
            textSecondary: '#B0B0B0',
            success: '#14F195',
            warning: '#FFA500',
            danger: '#FF4757',
            info: '#3B82F6'
        },
        ball: {
            filled: {
                background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)',
                color: '#000000',
                border: '#FFD700',
                shadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.3)',
                highlight: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)'
            },
            available: {
                background: '#0F0F0F',
                color: '#FFFFFF',
                border: '#2A2A2A',
                shadow: '0 6px 12px rgba(0, 0, 0, 0.3)'
            }
        }
    },
    christmas: {
        name: 'Christmas',
        icon: '🎄',
        description: 'Festive red, green, and gold holiday theme',
        colors: {
            primary: '#DC143C',
            primaryDark: '#8B0000',
            secondary: '#228B22',
            background: '#0A0A0A',
            cardBg: '#1A0F0F',
            border: '#3A1F1F',
            text: '#FFFFFF',
            textSecondary: '#B0B0B0',
            success: '#228B22',
            warning: '#FFD700',
            danger: '#DC143C',
            info: '#4169E1'
        },
        ball: {
            filled: {
                background: 'linear-gradient(135deg, #DC143C 0%, #8B0000 50%, #228B22 100%)',
                color: '#FFFFFF',
                border: '#FFD700',
                shadow: '0 6px 12px rgba(220, 20, 60, 0.5), inset 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.4)',
                highlight: 'radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 70%)',
                pattern: 'snowflakes' // Optional pattern indicator
            },
            available: {
                background: '#0A0A0A',
                color: '#FFFFFF',
                border: '#3A1F1F',
                shadow: '0 6px 12px rgba(0, 0, 0, 0.3)'
            }
        }
    },
    halloween: {
        name: 'Halloween',
        icon: '🎃',
        description: 'Spooky orange and black theme',
        colors: {
            primary: '#FF8C00',
            primaryDark: '#FF4500',
            secondary: '#8B0000',
            background: '#1A0A0A',
            cardBg: '#2A1A1A',
            border: '#3A2A2A',
            text: '#FFFFFF',
            textSecondary: '#B0B0B0',
            success: '#FF8C00',
            warning: '#FFD700',
            danger: '#8B0000',
            info: '#9370DB'
        },
        ball: {
            filled: {
                background: 'linear-gradient(135deg, #FF8C00 0%, #FF4500 50%, #8B0000 100%)',
                color: '#FFFFFF',
                border: '#FFD700',
                shadow: '0 6px 12px rgba(255, 140, 0, 0.6), inset 0 -2px 8px rgba(0, 0, 0, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.2)',
                highlight: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%)',
                pattern: 'pumpkin' // Optional pattern indicator
            },
            available: {
                background: '#1A0A0A',
                color: '#FFFFFF',
                border: '#3A2A2A',
                shadow: '0 6px 12px rgba(0, 0, 0, 0.3)'
            }
        }
    },
    valentine: {
        name: 'Valentine\'s Day',
        icon: '💝',
        description: 'Romantic pink and red theme',
        colors: {
            primary: '#FF69B4',
            primaryDark: '#DC143C',
            secondary: '#FF1493',
            background: '#1A0A0F',
            cardBg: '#2A1A1F',
            border: '#3A2A2F',
            text: '#FFFFFF',
            textSecondary: '#B0B0B0',
            success: '#FF69B4',
            warning: '#FFD700',
            danger: '#DC143C',
            info: '#9370DB'
        },
        ball: {
            filled: {
                background: 'linear-gradient(135deg, #FF69B4 0%, #DC143C 50%, #FF1493 100%)',
                color: '#FFFFFF',
                border: '#FFD700',
                shadow: '0 6px 12px rgba(255, 105, 180, 0.5), inset 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.4)',
                highlight: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
                pattern: 'hearts'
            },
            available: {
                background: '#1A0A0F',
                color: '#FFFFFF',
                border: '#3A2A2F',
                shadow: '0 6px 12px rgba(0, 0, 0, 0.3)'
            }
        }
    },
    easter: {
        name: 'Easter',
        icon: '🐰',
        description: 'Pastel spring colors theme',
        colors: {
            primary: '#FFB6C1',
            primaryDark: '#FF69B4',
            secondary: '#98FB98',
            background: '#0F0F0F',
            cardBg: '#1A1A1A',
            border: '#2A2A2A',
            text: '#FFFFFF',
            textSecondary: '#B0B0B0',
            success: '#98FB98',
            warning: '#FFD700',
            danger: '#FF69B4',
            info: '#87CEEB'
        },
        ball: {
            filled: {
                background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 50%, #98FB98 100%)',
                color: '#000000',
                border: '#FFD700',
                shadow: '0 6px 12px rgba(255, 182, 193, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.5)',
                highlight: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)',
                pattern: 'eggs'
            },
            available: {
                background: '#0F0F0F',
                color: '#FFFFFF',
                border: '#2A2A2A',
                shadow: '0 6px 12px rgba(0, 0, 0, 0.3)'
            }
        }
    },
    patriotic: {
        name: 'Patriotic',
        icon: '🇺🇸',
        description: 'Red, white, and blue theme',
        colors: {
            primary: '#DC143C',
            primaryDark: '#8B0000',
            secondary: '#4169E1',
            background: '#0A0A0F',
            cardBg: '#1A1A2A',
            border: '#2A2A3A',
            text: '#FFFFFF',
            textSecondary: '#B0B0B0',
            success: '#4169E1',
            warning: '#FFD700',
            danger: '#DC143C',
            info: '#4169E1'
        },
        ball: {
            filled: {
                background: 'linear-gradient(135deg, #DC143C 0%, #FFFFFF 50%, #4169E1 100%)',
                color: '#000000',
                border: '#FFD700',
                shadow: '0 6px 12px rgba(65, 105, 225, 0.5), inset 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.4)',
                highlight: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
                pattern: 'stars'
            },
            available: {
                background: '#0A0A0F',
                color: '#FFFFFF',
                border: '#2A2A3A',
                shadow: '0 6px 12px rgba(0, 0, 0, 0.3)'
            }
        }
    },
    neon: {
        name: 'Neon',
        icon: '💜',
        description: 'Vibrant neon cyberpunk theme',
        colors: {
            primary: '#FF00FF',
            primaryDark: '#8B00FF',
            secondary: '#00FFFF',
            background: '#000000',
            cardBg: '#0A0A0A',
            border: '#1A1A1A',
            text: '#FFFFFF',
            textSecondary: '#B0B0B0',
            success: '#00FF00',
            warning: '#FFFF00',
            danger: '#FF0000',
            info: '#00FFFF'
        },
        ball: {
            filled: {
                background: 'linear-gradient(135deg, #FF00FF 0%, #8B00FF 50%, #00FFFF 100%)',
                color: '#FFFFFF',
                border: '#00FFFF',
                shadow: '0 6px 12px rgba(255, 0, 255, 0.8), 0 0 20px rgba(255, 0, 255, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.2)',
                highlight: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)',
                pattern: 'circuit'
            },
            available: {
                background: '#000000',
                color: '#FFFFFF',
                border: '#1A1A1A',
                shadow: '0 6px 12px rgba(0, 0, 0, 0.3)'
            }
        }
    }
};

// Theme Manager Class
class ThemeManager {
    constructor() {
        this.customThemes = this.loadCustomThemes();
        this.pageThemes = this.loadPageThemes();
        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }

    // Load custom themes from localStorage
    loadCustomThemes() {
        const stored = localStorage.getItem('customThemes');
        return stored ? JSON.parse(stored) : {};
    }

    // Load page-specific theme settings
    loadPageThemes() {
        const stored = localStorage.getItem('pageThemes');
        return stored ? JSON.parse(stored) : {};
    }

    // Get theme for current page
    getThemeForCurrentPage() {
        const currentPage = this.getCurrentPageId();
        if (this.pageThemes[currentPage]) {
            const themeId = this.pageThemes[currentPage];
            if (themeId.startsWith('custom_')) {
                const customKey = themeId.replace('custom_', '');
                return this.customThemes[customKey] ? { key: themeId, theme: this.customThemes[customKey] } : null;
            } else {
                return THEMES[themeId] ? { key: themeId, theme: THEMES[themeId] } : null;
            }
        }
        return null;
    }

    // Get current page ID
    getCurrentPageId() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        const pageMap = {
            'index.html': 'index',
            'draw.html': 'draw',
            'public-draw.html': 'public-draw',
            'tokens.html': 'tokens',
            'users.html': 'users',
            'home.html': 'home',
            'login.html': 'login',
            'register.html': 'register',
            'theme-manager.html': 'theme-manager'
        };
        
        return pageMap[filename] || 'index';
    }

    // Load theme from localStorage or default to 'default'
    loadTheme() {
        // Check for page-specific theme first
        const pageTheme = this.getThemeForCurrentPage();
        if (pageTheme) {
            return pageTheme.key;
        }
        
        // Fall back to global theme
        const savedTheme = localStorage.getItem('lottoTheme');
        return savedTheme && (THEMES[savedTheme] || this.customThemes[savedTheme.replace('custom_', '')]) ? savedTheme : 'default';
    }

    // Save theme to localStorage
    saveTheme(themeKey) {
        localStorage.setItem('lottoTheme', themeKey);
        this.currentTheme = themeKey;
    }

    // Get current theme object
    getCurrentTheme() {
        if (this.currentTheme.startsWith('custom_')) {
            const customKey = this.currentTheme.replace('custom_', '');
            return this.customThemes[customKey] || THEMES.default;
        }
        return THEMES[this.currentTheme] || THEMES.default;
    }

    // Get all available themes (built-in + custom)
    getAllThemes() {
        const allThemes = { ...THEMES };
        Object.entries(this.customThemes).forEach(([key, theme]) => {
            allThemes[`custom_${key}`] = theme;
        });
        return allThemes;
    }

    // Apply theme to the page
    applyTheme(themeKey) {
        let theme;
        
        // Check if it's a custom theme
        if (themeKey.startsWith('custom_')) {
            const customKey = themeKey.replace('custom_', '');
            theme = this.customThemes[customKey];
            if (!theme) {
                console.warn(`Custom theme "${themeKey}" not found, using default`);
                themeKey = 'default';
                theme = THEMES[themeKey];
            }
        } else {
            theme = THEMES[themeKey];
            if (!theme) {
                console.warn(`Theme "${themeKey}" not found, using default`);
                themeKey = 'default';
                theme = THEMES[themeKey];
            }
        }
        const root = document.documentElement;

        // Apply CSS variables
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });

        // Add theme class to body for theme-specific styling
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeKey}`);

        // Save theme preference
        this.saveTheme(themeKey);

        // Dispatch custom event for theme change
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeKey, themeData: theme } 
        }));

        return theme;
    }

    // Get ball styles for current theme
    getBallStyles(type = 'filled') {
        const theme = this.getCurrentTheme();
        if (!theme || !theme.ball) {
            // Fallback to default theme
            return THEMES.default.ball[type] || THEMES.default.ball.filled;
        }
        return theme.ball[type] || theme.ball.filled;
    }

    // Apply ball styles to an element
    applyBallStyles(element, type = 'filled') {
        if (!element) return;
        
        const styles = this.getBallStyles(type);
        
        // Handle custom image
        if (styles.image || styles.backgroundImage) {
            element.style.backgroundImage = styles.backgroundImage || `url(${styles.image})`;
            element.style.backgroundSize = styles.backgroundSize || 'cover';
            element.style.backgroundPosition = styles.backgroundPosition || 'center';
            element.style.backgroundRepeat = 'no-repeat';
            element.style.background = 'none'; // Clear gradient if image is used
        } else if (styles.background) {
            element.style.background = styles.background;
            element.style.backgroundImage = 'none';
        }
        
        if (styles.color) {
            element.style.color = styles.color;
        }
        if (styles.border) {
            element.style.borderColor = styles.border;
            element.style.borderWidth = '2px';
            element.style.borderStyle = 'solid';
        }
        if (styles.shadow) {
            element.style.boxShadow = styles.shadow;
        }
        
        // Apply highlight if it exists (only if no custom image)
        if (styles.highlight && !styles.image && !styles.backgroundImage) {
            // Remove existing highlight first
            const existingHighlight = element.querySelector('.ball-highlight');
            if (existingHighlight) {
                existingHighlight.remove();
            }
            
            // Create new highlight
            const highlight = document.createElement('div');
            highlight.className = 'ball-highlight';
            highlight.style.position = 'absolute';
            highlight.style.top = '12%';
            highlight.style.left = '18%';
            highlight.style.width = '25%';
            highlight.style.height = '25%';
            highlight.style.borderRadius = '50%';
            highlight.style.background = styles.highlight;
            highlight.style.pointerEvents = 'none';
            highlight.style.zIndex = '1';
            
            // Ensure parent has relative positioning
            if (getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }
            
            element.appendChild(highlight);
        } else {
            // Remove highlight if using custom image
            const highlight = element.querySelector('.ball-highlight');
            if (highlight) {
                highlight.remove();
            }
        }
    }
}

// Create global theme manager instance
window.themeManager = new ThemeManager();

// Apply page-specific theme on page load
window.addEventListener('DOMContentLoaded', () => {
    if (window.themeManager) {
        // Check for page-specific theme
        const pageTheme = window.themeManager.getThemeForCurrentPage();
        if (pageTheme) {
            window.themeManager.applyTheme(pageTheme.key);
        } else {
            // Ensure default theme is applied
            window.themeManager.applyTheme('default');
        }
        
        // Re-apply ball styles after theme is loaded
        setTimeout(() => {
            if (typeof applyThemeToBalls === 'function') {
                applyThemeToBalls();
            }
            if (typeof applyThemeToLottoBalls === 'function') {
                applyThemeToLottoBalls();
            }
        }, 100);
    }
});

// Listen for page theme changes
window.addEventListener('storage', (e) => {
    if (e.key === 'pageThemes' && window.themeManager) {
        window.themeManager.pageThemes = JSON.parse(e.newValue || '{}');
        const pageTheme = window.themeManager.getThemeForCurrentPage();
        if (pageTheme) {
            window.themeManager.applyTheme(pageTheme.key);
        }
    }
    if (e.key === 'customThemes' && window.themeManager) {
        window.themeManager.customThemes = JSON.parse(e.newValue || '{}');
        const pageTheme = window.themeManager.getThemeForCurrentPage();
        if (pageTheme) {
            window.themeManager.applyTheme(pageTheme.key);
        }
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { THEMES, ThemeManager };
}

