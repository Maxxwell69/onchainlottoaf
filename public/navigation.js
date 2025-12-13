// Navigation component for authenticated pages
function renderNavigation() {
    const user = authManager.getCurrentUser();
    if (!user) return '';

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isModerator = user.role === 'moderator' || isAdmin;

    return `
        <nav class="main-nav">
            <div class="nav-brand">
                <h2>🎰 On Chain Lotto</h2>
            </div>
            <div class="nav-menu">
                <a href="index.html" class="nav-link">🎯 Dashboard</a>
                ${isModerator ? '<a href="draw.html" class="nav-link">📊 Draws</a>' : ''}
                ${isAdmin ? '<a href="tokens.html" class="nav-link">🎫 Tokens</a>' : ''}
                ${isAdmin ? '<a href="users.html" class="nav-link">👥 Users</a>' : ''}
            </div>
            <div class="nav-user">
                <span class="user-info">
                    <span class="username">${user.username}</span>
                    <span class="user-role role-${user.role}">${user.role}</span>
                </span>
                <button class="btn btn-small btn-secondary" onclick="authManager.logout()">Logout</button>
            </div>
        </nav>
    `;
}

// Insert navigation into page
function initNavigation() {
    const navContainer = document.getElementById('main-navigation');
    if (navContainer) {
        navContainer.innerHTML = renderNavigation();
    } else {
        // Try to insert at the beginning of container
        const container = document.querySelector('.container');
        if (container) {
            const nav = document.createElement('div');
            nav.id = 'main-navigation';
            nav.innerHTML = renderNavigation();
            container.insertBefore(nav, container.firstChild);
        }
    }
}

// Initialize navigation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}



