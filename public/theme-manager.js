// Theme Manager - Advanced theme customization and page-specific theme control

const API_URL = window.location.origin;

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Page definitions
const PAGES = [
    { id: 'index', name: 'Dashboard', icon: '🎯', path: 'index.html' },
    { id: 'draw', name: 'Draw Admin', icon: '📊', path: 'draw.html' },
    { id: 'public-draw', name: 'Public Draw', icon: '🌐', path: 'public-draw.html' },
    { id: 'tokens', name: 'Tokens', icon: '🎫', path: 'tokens.html' },
    { id: 'users', name: 'Users', icon: '👥', path: 'users.html' },
    { id: 'home', name: 'Home', icon: '🏠', path: 'home.html' },
    { id: 'login', name: 'Login', icon: '🔑', path: 'login.html' },
    { id: 'register', name: 'Register', icon: '📝', path: 'register.html' }
];

// Ball style options
const BALL_STYLES = {
    gradient: { name: 'Gradient', icon: '🌈' },
    solid: { name: 'Solid Color', icon: '⚫' },
    pattern: { name: 'Pattern', icon: '🎨' },
    image: { name: 'Custom Image', icon: '🖼️' },
    emoji: { name: 'Emoji', icon: '😀' }
};

// Initialize theme manager
class ThemeManagerPage {
    constructor() {
        this.currentEditingTheme = null;
        this.pageThemes = this.loadPageThemes();
        this.customThemes = this.loadCustomThemes();
        this.init();
    }

    init() {
        this.renderPageSelector();
        this.renderThemeSelector();
        this.setupThemeEditor();
        this.renderCustomThemes();
        this.loadCurrentPageTheme();
    }

    // Load page-specific theme settings
    loadPageThemes() {
        const stored = localStorage.getItem('pageThemes');
        return stored ? JSON.parse(stored) : {};
    }

    // Save page-specific theme settings
    savePageThemes() {
        localStorage.setItem('pageThemes', JSON.stringify(this.pageThemes));
    }

    // Load custom themes
    loadCustomThemes() {
        const stored = localStorage.getItem('customThemes');
        return stored ? JSON.parse(stored) : {};
    }

    // Save custom themes (with image compression)
    saveCustomThemes() {
        try {
            // Compress images before saving to avoid quota issues
            const compressedThemes = this.compressThemeImages(this.customThemes);
            localStorage.setItem('customThemes', JSON.stringify(compressedThemes));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                showToast('❌ Storage quota exceeded. Please remove some custom themes or use smaller images.', 'error');
                console.error('Storage quota exceeded. Theme data too large.');
            } else {
                throw error;
            }
        }
    }

    // Compress theme images to reduce storage size
    compressThemeImages(themes) {
        const compressed = {};
        Object.entries(themes).forEach(([key, theme]) => {
            const compressedTheme = { ...theme };
            
            // Remove or compress large image data
            if (compressedTheme.ball?.filled?.image) {
                const imageData = compressedTheme.ball.filled.image;
                // If image is base64 and too large, remove it or compress
                if (imageData.length > 100000) { // ~100KB limit
                    console.warn(`Image for theme ${key} is too large (${imageData.length} bytes), removing to save space`);
                    delete compressedTheme.ball.filled.image;
                    delete compressedTheme.ball.filled.backgroundImage;
                }
            }
            
            compressed[key] = compressedTheme;
        });
        return compressed;
    }

    // Render page selector
    renderPageSelector() {
        const container = document.getElementById('pageSelector');
        container.innerHTML = PAGES.map(page => {
            const currentTheme = this.pageThemes[page.id] || 'default';
            return `
                <div class="page-item">
                    <label>
                        <span style="font-size: 1.5rem;">${page.icon}</span>
                        <div>
                            <div style="font-weight: 600;">${page.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${page.path}</div>
                        </div>
                    </label>
                    <select class="theme-select" style="width: 200px;" data-page="${page.id}">
                        ${this.renderThemeOptions(currentTheme)}
                    </select>
                </div>
            `;
        }).join('');

        // Add change listeners
        container.querySelectorAll('select[data-page]').forEach(select => {
            select.addEventListener('change', (e) => {
                const pageId = e.target.dataset.page;
                const themeId = e.target.value;
                this.pageThemes[pageId] = themeId;
                this.savePageThemes();
                showToast(`✅ Theme for ${PAGES.find(p => p.id === pageId).name} updated`, 'success');
            });
        });
    }

    // Render theme options for dropdown
    renderThemeOptions(selectedTheme = 'default') {
        const builtInThemes = window.themeManager ? window.themeManager.getAllThemes() : {};
        let html = '';

        // Built-in themes
        Object.entries(builtInThemes).forEach(([key, theme]) => {
            html += `<option value="${key}" ${key === selectedTheme ? 'selected' : ''}>${theme.icon} ${theme.name}</option>`;
        });

        // Custom themes
        Object.entries(this.customThemes).forEach(([key, theme]) => {
            html += `<option value="custom_${key}" ${`custom_${key}` === selectedTheme ? 'selected' : ''}>${theme.icon} ${theme.name} (Custom)</option>`;
        });

        return html;
    }

    // Render theme selector for editor
    renderThemeSelector() {
        const select = document.getElementById('editThemeSelect');
        const builtInThemes = window.themeManager ? window.themeManager.getAllThemes() : {};
        
        let html = '<option value="">-- Select a theme --</option>';
        
        // Built-in themes
        Object.entries(builtInThemes).forEach(([key, theme]) => {
            html += `<option value="${key}">${theme.icon} ${theme.name}</option>`;
        });

        // Custom themes
        Object.entries(this.customThemes).forEach(([key, theme]) => {
            html += `<option value="custom_${key}">${theme.icon} ${theme.name} (Custom)</option>`;
        });

        select.innerHTML = html;

        select.addEventListener('change', (e) => {
            const themeId = e.target.value;
            if (themeId) {
                this.loadThemeForEditing(themeId);
            } else {
                document.getElementById('themeEditor').style.display = 'none';
            }
        });
    }

    // Load theme for editing
    loadThemeForEditing(themeId) {
        let theme;
        
        if (themeId.startsWith('custom_')) {
            const customKey = themeId.replace('custom_', '');
            theme = this.customThemes[customKey];
            this.currentEditingTheme = { key: customKey, isCustom: true };
        } else {
            theme = window.themeManager.getAllThemes()[themeId];
            this.currentEditingTheme = { key: themeId, isCustom: false };
        }

        if (!theme) return;

        // Populate form
        document.getElementById('themeName').value = theme.name;
        document.getElementById('themeIcon').value = theme.icon;

        // Populate color pickers
        this.renderColorPickers(theme.colors);

        // Populate ball options
        this.renderBallOptions(theme.ball);

        // Show editor
        document.getElementById('themeEditor').style.display = 'block';

        // Update preview
        this.updatePreview(theme);
    }

    // Render color pickers
    renderColorPickers(colors) {
        const container = document.getElementById('colorPickers');
        container.innerHTML = Object.entries(colors).map(([key, value]) => {
            return `
                <div class="color-picker-item">
                    <label>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                    <div class="color-input-wrapper">
                        <input type="color" 
                               class="color-input" 
                               data-color="${key}" 
                               value="${value}"
                               onchange="themeManagerPage.updateColor('${key}', this.value)">
                        <input type="text" 
                               class="color-text-input" 
                               data-color="${key}" 
                               value="${value}"
                               onchange="themeManagerPage.updateColor('${key}', this.value)">
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update color value
    updateColor(key, value) {
        // Update both inputs
        document.querySelectorAll(`[data-color="${key}"]`).forEach(input => {
            if (input.type === 'color' || input.type === 'text') {
                input.value = value;
            }
        });

        // Update preview
        this.updatePreviewFromForm();
    }

    // Render ball options
    renderBallOptions(ballConfig) {
        // Filled ball options
        const filledContainer = document.getElementById('filledBallOptions');
        const filledStyle = ballConfig.filled?.style || 'gradient';
        filledContainer.innerHTML = Object.entries(BALL_STYLES).map(([key, style]) => {
            const isSelected = filledStyle === key;
            return `
                <div class="ball-image-option ${isSelected ? 'selected' : ''}">
                    <input type="radio" 
                           name="filledBallStyle" 
                           value="${key}" 
                           ${isSelected ? 'checked' : ''}
                           onchange="themeManagerPage.updateBallStyle('filled', '${key}')">
                    <label>
                        <div class="ball-preview" style="background: ${ballConfig.filled?.background || 'var(--primary)'};">
                            ${style.icon}
                        </div>
                        <div>${style.name}</div>
                    </label>
                </div>
            `;
        }).join('');

        // Available ball options
        const availableContainer = document.getElementById('availableBallOptions');
        const availableStyle = ballConfig.available?.style || 'solid';
        availableContainer.innerHTML = Object.entries(BALL_STYLES).map(([key, style]) => {
            const isSelected = availableStyle === key;
            return `
                <div class="ball-image-option ${isSelected ? 'selected' : ''}">
                    <input type="radio" 
                           name="availableBallStyle" 
                           value="${key}" 
                           ${isSelected ? 'checked' : ''}
                           onchange="themeManagerPage.updateBallStyle('available', '${key}')">
                    <label>
                        <div class="ball-preview" style="background: ${ballConfig.available?.background || 'var(--background)'}; border: 2px solid var(--border);">
                            ${style.icon}
                        </div>
                        <div>${style.name}</div>
                    </label>
                </div>
            `;
        }).join('');

        // Image upload
        this.setupImageUpload();
        
        // Show image preview if exists
        if (ballConfig.filled?.image) {
            const preview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImage');
            previewImg.src = ballConfig.filled.image;
            preview.style.display = 'block';
        }
    }

    // Update ball style
    updateBallStyle(type, style) {
        // Update selected state
        document.querySelectorAll(`input[name="${type}BallStyle"]`).forEach(radio => {
            const option = radio.closest('.ball-image-option');
            if (radio.value === style) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        this.updatePreviewFromForm();
    }

    // Setup image upload
    setupImageUpload() {
        const uploadArea = document.getElementById('imageUploadArea');
        const fileInput = document.getElementById('ballImageUpload');
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImage');
        const removeBtn = document.getElementById('removeImage');

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload(file);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageUpload(file);
            }
        });

        removeBtn.addEventListener('click', () => {
            preview.style.display = 'none';
            fileInput.value = '';
            if (this.currentEditingTheme) {
                // Remove image from theme
                this.updatePreviewFromForm();
            }
        });
    }

    // Handle image upload with compression
    handleImageUpload(file) {
        // Check file size first
        if (file.size > 500000) { // 500KB limit
            showToast('❌ Image too large! Please use images under 500KB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImage');
            
            // Compress image before storing
            this.compressImage(e.target.result, 200, 200, 0.7).then(compressed => {
                previewImg.src = compressed;
                preview.style.display = 'block';
                
                // Store compressed image data
                if (this.currentEditingTheme) {
                    if (!this.customThemes[this.currentEditingTheme.key]) {
                        this.customThemes[this.currentEditingTheme.key] = {};
                    }
                    if (!this.customThemes[this.currentEditingTheme.key].ball) {
                        this.customThemes[this.currentEditingTheme.key].ball = {};
                    }
                    if (!this.customThemes[this.currentEditingTheme.key].ball.filled) {
                        this.customThemes[this.currentEditingTheme.key].ball.filled = {};
                    }
                    this.customThemes[this.currentEditingTheme.key].ball.filled.image = compressed;
                }
            }).catch(error => {
                console.error('Image compression error:', error);
                showToast('❌ Error processing image', 'error');
            });
        };
        reader.readAsDataURL(file);
    }

    // Compress image to reduce storage size
    compressImage(dataUrl, maxWidth, maxHeight, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to compressed data URL
                const compressed = canvas.toDataURL('image/png', quality);
                resolve(compressed);
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    // Update preview from form data
    updatePreviewFromForm() {
        const theme = this.getThemeFromForm();
        this.updatePreview(theme);
    }

    // Get theme data from form
    getThemeFromForm() {
        const colors = {};
        document.querySelectorAll('[data-color]').forEach(input => {
            if (input.type === 'color' || input.type === 'text') {
                const key = input.dataset.color;
                colors[key] = input.value;
            }
        });

        const filledStyle = document.querySelector('input[name="filledBallStyle"]:checked')?.value || 'gradient';
        const availableStyle = document.querySelector('input[name="availableBallStyle"]:checked')?.value || 'solid';
        
        // Get ball image if uploaded
        const previewImg = document.getElementById('previewImage');
        const ballImage = previewImg && previewImg.src && previewImg.src !== window.location.href ? previewImg.src : null;

        const filledBall = {
            style: filledStyle,
            background: colors.primary ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` : 'var(--primary)',
            color: colors.text || '#000000',
            border: colors.primary || 'var(--primary)'
        };
        
        if (ballImage) {
            filledBall.image = ballImage;
            filledBall.backgroundImage = `url(${ballImage})`;
            filledBall.backgroundSize = 'cover';
            filledBall.backgroundPosition = 'center';
        }

        return {
            name: document.getElementById('themeName').value,
            icon: document.getElementById('themeIcon').value,
            description: 'Custom theme',
            colors: colors,
            ball: {
                filled: filledBall,
                available: {
                    style: availableStyle,
                    background: colors.background || 'var(--background)',
                    color: colors.text || '#FFFFFF',
                    border: colors.border || 'var(--border)'
                }
            }
        };
    }

    // Update preview
    updatePreview(theme) {
        const filledPreview = document.getElementById('previewFilled');
        const availablePreview = document.getElementById('previewAvailable');

        if (theme.ball?.filled) {
            filledPreview.style.background = theme.ball.filled.background || theme.colors.primary || 'var(--primary)';
            filledPreview.style.color = theme.ball.filled.color || '#000000';
            filledPreview.style.border = `2px solid ${theme.colors.primary || 'var(--primary)'}`;
        }

        if (theme.ball?.available) {
            availablePreview.style.background = theme.ball.available.background || theme.colors.background || 'var(--background)';
            availablePreview.style.color = theme.ball.available.color || '#FFFFFF';
            availablePreview.style.border = `2px solid ${theme.colors.border || 'var(--border)'}`;
        }
    }

    // Setup theme editor
    setupThemeEditor() {
        // Save theme button
        document.getElementById('saveThemeBtn').addEventListener('click', () => {
            this.saveTheme();
        });

        // Create new theme button
        document.getElementById('createNewThemeBtn').addEventListener('click', () => {
            this.createNewTheme();
        });

        // Real-time preview updates
        document.getElementById('themeName').addEventListener('input', () => this.updatePreviewFromForm());
        document.getElementById('themeIcon').addEventListener('input', () => this.updatePreviewFromForm());
    }

    // Save theme
    saveTheme() {
        if (!this.currentEditingTheme) {
            showToast('❌ Please select a theme to edit', 'error');
            return;
        }

        const themeData = this.getThemeFromForm();

        if (!themeData.name || !themeData.icon) {
            showToast('❌ Please fill in theme name and icon', 'error');
            return;
        }

        // Check image size before saving
        if (themeData.ball?.filled?.image) {
            const imageSize = themeData.ball.filled.image.length;
            if (imageSize > 200000) { // ~200KB limit
                if (!confirm(`Warning: The image is very large (${Math.round(imageSize/1024)}KB). This may cause storage issues. Continue anyway?`)) {
                    return;
                }
            }
        }

        try {
            // Save custom theme
            if (this.currentEditingTheme.isCustom) {
                this.customThemes[this.currentEditingTheme.key] = themeData;
            } else {
                // Create a copy as custom theme
                const newKey = `custom_${Date.now()}`;
                this.customThemes[newKey] = themeData;
                this.currentEditingTheme = { key: newKey, isCustom: true };
            }

            this.saveCustomThemes();
            this.renderThemeSelector();
            this.renderPageSelector();
            this.renderCustomThemes();
            
            showToast('✅ Theme saved successfully!', 'success');
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                showToast('❌ Storage full! Please remove some themes or use smaller images.', 'error');
            } else {
                showToast(`❌ Error saving theme: ${error.message}`, 'error');
            }
            console.error('Error saving theme:', error);
        }
    }

    // Create new theme
    createNewTheme() {
        const newKey = `custom_${Date.now()}`;
        const defaultTheme = {
            name: 'New Custom Theme',
            icon: '🎨',
            description: 'Custom theme',
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
                    style: 'gradient',
                    background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
                    color: '#000000',
                    border: '#FFD700'
                },
                available: {
                    style: 'solid',
                    background: '#0F0F0F',
                    color: '#FFFFFF',
                    border: '#2A2A2A'
                }
            }
        };

        this.customThemes[newKey] = defaultTheme;
        this.saveCustomThemes();
        
        // Load for editing
        this.currentEditingTheme = { key: newKey, isCustom: true };
        this.loadThemeForEditing(`custom_${newKey}`);
        
        // Update selector
        const select = document.getElementById('editThemeSelect');
        select.value = `custom_${newKey}`;
        
        showToast('✅ New theme created!', 'success');
    }

    // Render custom themes list
    renderCustomThemes() {
        const container = document.getElementById('customThemesList');
        
        if (Object.keys(this.customThemes).length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No custom themes yet. Create one using the editor!</p>';
            return;
        }

        container.innerHTML = Object.entries(this.customThemes).map(([key, theme]) => {
            return `
                <div class="custom-theme-item">
                    <div>
                        <div style="font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                            <span>${theme.icon}</span>
                            <span>${theme.name}</span>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            Created: ${new Date(parseInt(key.split('_')[1])).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="custom-theme-actions">
                        <button class="btn btn-secondary btn-sm" onclick="themeManagerPage.editTheme('${key}')">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="themeManagerPage.deleteTheme('${key}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Edit theme
    editTheme(key) {
        const select = document.getElementById('editThemeSelect');
        select.value = `custom_${key}`;
        this.loadThemeForEditing(`custom_${key}`);
    }

    // Delete theme
    deleteTheme(key) {
        if (!confirm(`Are you sure you want to delete "${this.customThemes[key].name}"?`)) {
            return;
        }

        delete this.customThemes[key];
        this.saveCustomThemes();
        this.renderCustomThemes();
        this.renderThemeSelector();
        this.renderPageSelector();
        
        showToast('✅ Theme deleted', 'success');
    }

    // Load current page theme
    loadCurrentPageTheme() {
        // This would be called when a page loads to apply the page-specific theme
        // Implementation depends on how pages are structured
    }
}

// Initialize when DOM is ready
let themeManagerPage;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeManagerPage = new ThemeManagerPage();
        window.themeManagerPage = themeManagerPage;
    });
} else {
    themeManagerPage = new ThemeManagerPage();
    window.themeManagerPage = themeManagerPage;
}

