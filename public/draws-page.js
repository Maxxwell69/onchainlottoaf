// Draws page functionality (cloned from home.js)
const API_URL = window.location.origin;

// Check if user is logged in
function isLoggedIn() {
    if (typeof authManager !== 'undefined') {
        return authManager.isAuthenticated();
    }
    return false;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        let datePart, timePart;
        
        if (dateString.includes('T')) {
            const isoDate = dateString.split('T')[0];
            const isoTime = dateString.split('T')[1].split('.')[0];
            datePart = isoDate;
            timePart = isoTime;
        } else {
            [datePart, timePart] = dateString.split(' ');
        }
        
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        const date = new Date(year, month - 1, day, hour, minute, second || 0);
        
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

// Render draw card for public view (horizontal layout)
function renderDrawCard(draw, isLoggedIn = false) {
    const progress = (draw.filled_slots / draw.total_slots * 100).toFixed(1);
    const statusClass = draw.status === 'active' ? 'status-active' : 
                       draw.status === 'completed' ? 'status-completed' : 'status-cancelled';
    
    return `
        <div class="draw-card-horizontal" style="
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            min-width: 300px;
            max-width: 400px;
            flex: 0 0 auto;
            transition: all 0.3s;
        ">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h3 style="margin: 0 0 0.5rem 0; color: var(--primary); font-size: 1.5rem;">${draw.draw_name}</h3>
                    <span class="status-badge ${statusClass}" style="
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.875rem;
                        font-weight: 600;
                        text-transform: uppercase;
                    ">${draw.status}</span>
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
                ${draw.prize_description_short ? `
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Prize</div>
                    <div style="font-weight: 600; color: var(--primary); font-size: 0.95rem;">${draw.prize_description_short}</div>
                </div>
                ` : ''}
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Token</div>
                    <div style="font-weight: 600; color: var(--text);">${draw.token_symbol || 'Unknown'}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Progress</div>
                    <div style="font-weight: 600; color: var(--text);">${draw.filled_slots}/${draw.total_slots} (${progress}%)</div>
                </div>
            </div>
            
            <div class="progress-bar" style="
                width: 100%;
                height: 20px;
                background: var(--background);
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 1rem;
            ">
                <div class="progress-fill" style="
                    height: 100%;
                    background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
                    width: ${progress}%;
                    transition: width 0.5s ease;
                "></div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <a href="public-draw.html?id=${draw.id}" class="btn btn-primary" style="
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: all 0.3s;
                    text-align: center;
                    width: 100%;
                ">
                    🌐 View Draw
                </a>
            </div>
        </div>
    `;
}

// Load only active draws
async function loadAllDraws() {
    const container = document.getElementById('allDrawsContainer');
    
    try {
        const response = await fetch(`${API_URL}/api/draws/active`);
        const data = await response.json();
        
        if (data.draws && data.draws.length > 0) {
            container.innerHTML = data.draws.map(draw => renderDrawCard(draw, false)).join('');
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <h3>No Active Draws</h3>
                    <p>Check back soon for new lotto draws!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading draws:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--danger);">
                <h3>Error Loading Draws</h3>
                <p>Please try refreshing the page</p>
            </div>
        `;
    }
}

// Update navigation based on login status
function updateNavigation() {
    const navLinks = document.getElementById('navLinks');
    
    if (isLoggedIn()) {
        const user = authManager.getCurrentUser();
        const isAdmin = user.role === 'admin' || user.role === 'super_admin';
        const isModerator = user.role === 'moderator' || isAdmin;
        
        if (navLinks) {
            navLinks.innerHTML = `
                <a href="home.html" class="nav-link">Home</a>
                <a href="index.html" class="nav-link">🎯 Dashboard</a>
                ${isModerator ? '<a href="draws.html" class="nav-link">📊 Draws</a>' : ''}
                ${isAdmin ? '<a href="tokens.html" class="nav-link">🎫 Tokens</a>' : ''}
                ${isAdmin ? '<a href="users.html" class="nav-link">👥 Users</a>' : ''}
                <a href="theme-manager.html" class="nav-link">🎨 Themes</a>
                <span style="color: var(--text-secondary); margin: 0 1rem;">${user.username}</span>
                <button class="btn btn-secondary" onclick="authManager.logout()">Logout</button>
            `;
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadAllDraws();
    updateNavigation();
    
    // Refresh draws every 30 seconds
    setInterval(() => {
        loadAllDraws();
    }, 30000);
});

// Listen for login/logout events
window.addEventListener('storage', (e) => {
    if (e.key === 'authToken' || e.key === 'user') {
        updateNavigation();
        loadAllDraws();
    }
});

