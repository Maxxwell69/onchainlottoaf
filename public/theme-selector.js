// Theme Selector UI Component
// Provides a UI for selecting and previewing themes

class ThemeSelector {
    constructor() {
        this.selector = null;
        this.init();
    }

    init() {
        // DISABLED: Theme selector button removed
        // Themes can only be changed from theme-manager.html (admin area)
        // Don't create the button automatically
        return;
        
        // Listen for theme changes (kept for compatibility)
        window.addEventListener('themeChanged', () => {
            // Theme changes are handled by theme manager page
        });
    }

    createSelectorButton() {
        // Check if selector already exists
        const existing = document.getElementById('themeSelectorBtn');
        if (existing) {
            this.selector = existing;
            this.updateSelectorButton();
            return;
        }

        const button = document.createElement('button');
        button.id = 'themeSelectorBtn';
        button.className = 'btn btn-secondary theme-selector-btn';
        button.innerHTML = '🎨 Theme';
        button.title = 'Change theme';
        button.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 10000 !important;
            padding: 0.75rem 1.25rem !important;
            font-size: 0.9rem !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3) !important;
            background: linear-gradient(135deg, var(--card-bg) 0%, var(--background) 100%) !important;
            border: 2px solid var(--primary) !important;
            border-radius: 8px !important;
            color: var(--primary) !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            visibility: visible !important;
            opacity: 1 !important;
            transition: all 0.3s ease !important;
            min-width: 120px !important;
        `;
        
        // Add hover effect
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.5) !important';
            this.style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%) !important';
            this.style.color = '#000000 !important';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3) !important';
            this.style.background = 'linear-gradient(135deg, var(--card-bg) 0%, var(--background) 100%) !important';
            this.style.color = 'var(--primary) !important';
        });
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openThemeModal();
        });

        // Always add to body first (most reliable)
        if (document.body) {
            document.body.appendChild(button);
        } else {
            // Wait for body to be ready
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(button);
            });
        }
        
        this.selector = button;
        console.log('Theme button created:', button);
        
        // Update button text after a short delay to ensure themeManager is loaded
        setTimeout(() => {
            this.updateSelectorButton();
        }, 300);

        // Also try to add to navigation if it exists (optional, for better placement)
        setTimeout(() => {
            const nav = document.querySelector('.main-nav');
            if (nav && nav.querySelector('.nav-user')) {
                const navUser = nav.querySelector('.nav-user');
                const themeBtnNav = document.createElement('button');
                themeBtnNav.id = 'themeSelectorBtnNav';
                themeBtnNav.className = 'btn btn-secondary';
                themeBtnNav.innerHTML = button.innerHTML;
                themeBtnNav.title = 'Change theme';
                themeBtnNav.style.cssText = 'margin-right: 1rem;';
                themeBtnNav.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openThemeModal();
                });
                nav.insertBefore(themeBtnNav, navUser);
                
                // Update both buttons when theme changes
                const originalUpdate = this.updateSelectorButton.bind(this);
                this.updateSelectorButton = () => {
                    originalUpdate();
                    if (themeBtnNav && window.themeManager) {
                        const currentTheme = window.themeManager.getCurrentTheme();
                        if (currentTheme) {
                            themeBtnNav.innerHTML = `${currentTheme.icon} ${currentTheme.name}`;
                        }
                    }
                };
            }
        }, 500);
    }

    updateSelectorButton() {
        if (!this.selector) return;
        
        // Wait for themeManager to be available
        if (!window.themeManager) {
            setTimeout(() => this.updateSelectorButton(), 100);
            return;
        }
        
        const currentTheme = window.themeManager.getCurrentTheme();
        if (currentTheme) {
            this.selector.innerHTML = `${currentTheme.icon} ${currentTheme.name}`;
        }
    }

    openThemeModal() {
        // Remove existing modal if present
        const existing = document.getElementById('themeModal');
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'themeModal';
        modal.className = 'modal';
        modal.style.display = 'flex';

        const themes = window.themeManager.getAllThemes();
        const currentThemeKey = window.themeManager.currentTheme;

        let html = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>🎨 Select Theme</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="themes-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;">
        `;

        Object.entries(themes).forEach(([key, theme]) => {
            const isActive = key === currentThemeKey;
            html += `
                <div class="theme-card ${isActive ? 'active' : ''}" 
                     data-theme="${key}"
                     style="
                         padding: 1.5rem;
                         background: var(--card-bg);
                         border: 2px solid ${isActive ? 'var(--primary)' : 'var(--border)'};
                         border-radius: 12px;
                         cursor: pointer;
                         transition: all 0.3s;
                         text-align: center;
                     ">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">${theme.icon}</div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">${theme.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${theme.description}</div>
                    ${isActive ? '<div style="margin-top: 0.5rem; color: var(--primary); font-weight: 600;">✓ Active</div>' : ''}
                </div>
            `;
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        modal.innerHTML = html;
        document.body.appendChild(modal);

        // Add click handlers
        modal.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                const themeKey = card.dataset.theme;
                window.themeManager.applyTheme(themeKey);
                this.updateSelectorButton();
                modal.remove();
                
                // Show toast notification
                if (window.showToast) {
                    window.showToast(`Theme changed to ${themes[themeKey].name} ${themes[themeKey].icon}`, 'success');
                }
            });
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Add hover effects
        modal.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                if (!this.classList.contains('active')) {
                    this.style.borderColor = 'var(--primary)';
                    this.style.transform = 'translateY(-2px)';
                }
            });
            card.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.borderColor = 'var(--border)';
                    this.style.transform = 'translateY(0)';
                }
            });
        });
    }
}

// Initialize theme selector when DOM is ready
// DISABLED: Theme selector button removed - themes can only be changed from admin area
function initThemeSelector() {
    // Theme selector is now disabled - themes can only be changed from theme-manager.html
    // This function is kept for compatibility but does nothing
    return;
}

// Don't initialize theme selector automatically
// Themes can only be changed from the theme manager admin page

