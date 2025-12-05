// Authentication utilities
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    // Login function
    async login(usernameOrEmail, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username: usernameOrEmail, 
                    password: password 
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (!data.token) {
                    console.error('Login response missing token:', data);
                    return { success: false, error: 'Server error: No token received' };
                }
                
                this.token = data.token;
                this.user = data.user;
                
                // Store in localStorage
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                return { success: true, user: this.user };
            } else {
                console.error('Login failed:', response.status, data);
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login network error:', error);
            return { success: false, error: 'Network error: ' + error.message };
        }
    }

    // Logout function
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login.html';
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Get auth headers for API requests
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    // Verify token with server
    async verifyToken() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.logout();
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }
}

// Global auth manager instance
const authManager = new AuthManager();

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Skip auth check for public pages
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('home.html') ||
        window.location.pathname.includes('public-draw')) {
        return;
    }

    // Check if user is authenticated
    if (!authManager.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Verify token with server
    const isValid = await authManager.verifyToken();
    if (!isValid) {
        window.location.href = '/login.html';
        return;
    }

    // Check if user is superadmin for admin pages
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname.includes('draw.html') ||
        window.location.pathname.includes('tokens.html') ||
        window.location.pathname.includes('users.html')) {
        const user = authManager.getCurrentUser();
        if (!user || user.role !== 'super_admin') {
            alert('Access denied. Superadmin privileges required.');
            authManager.logout();
            return;
        }
    }

    // Add user info to page if needed
    const user = authManager.getCurrentUser();
    if (user) {
        // Update any user-specific elements
        const userElements = document.querySelectorAll('[data-user-info]');
        userElements.forEach(element => {
            const info = element.getAttribute('data-user-info');
            if (info === 'username') {
                element.textContent = user.username;
            }
        });
    }
});

// Export for use in other scripts
window.authManager = authManager;
