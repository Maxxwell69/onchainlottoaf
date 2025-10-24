// User Management JavaScript
const API_URL = window.location.origin;
let currentUsers = [];
let currentPage = 1;
let totalPages = 1;
let editingUserId = null;

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Load users with filters
async function loadUsers(page = 1, search = '', role = '', status = '') {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 10,
            search: search,
            role: role,
            status: status
        });

        const response = await fetch(`${API_URL}/api/users?${params}`);
        const data = await response.json();

        if (response.ok) {
            currentUsers = data.users;
            currentPage = data.pagination.page;
            totalPages = data.pagination.pages;
            
            renderUsersTable();
            renderPagination();
        } else {
            showToast(`❌ Failed to load users: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('❌ Failed to load users', 'error');
    }
}

// Render users table
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    
    if (currentUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = currentUsers.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.email || '-'}</td>
            <td>
                <span class="role-badge role-${user.role}">${user.role.replace('_', ' ')}</span>
            </td>
            <td>
                <span class="status-badge status-${user.status}">${user.status}</span>
            </td>
            <td>${formatDate(user.created_at)}</td>
            <td>${user.last_login ? formatDate(user.last_login) : 'Never'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})">✏️ Edit</button>
                ${user.username !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id}, '${user.username}')">🗑️ Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-controls">';
    
    // Previous button
    if (currentPage > 1) {
        html += `<button class="btn btn-sm btn-secondary" onclick="loadUsers(${currentPage - 1})">← Previous</button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'btn-primary' : 'btn-secondary';
        html += `<button class="btn btn-sm ${activeClass}" onclick="loadUsers(${i})">${i}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        html += `<button class="btn btn-sm btn-secondary" onclick="loadUsers(${currentPage + 1})">Next →</button>`;
    }
    
    html += '</div>';
    pagination.innerHTML = html;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Open add user modal
function openAddUserModal() {
    editingUserId = null;
    document.getElementById('modalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('password').required = true;
    document.getElementById('userModal').style.display = 'block';
}

// Edit user
function editUser(userId) {
    const user = currentUsers.find(u => u.id === userId);
    if (!user) return;

    editingUserId = userId;
    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('username').value = user.username;
    document.getElementById('email').value = user.email || '';
    document.getElementById('role').value = user.role;
    document.getElementById('status').value = user.status;
    document.getElementById('password').required = false;
    document.getElementById('password').placeholder = 'Leave blank to keep current password';
    document.getElementById('userModal').style.display = 'block';
}

// Delete user
async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/users/${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showToast('✅ User deleted successfully', 'success');
            loadUsers(currentPage);
        } else {
            showToast(`❌ Failed to delete user: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('❌ Failed to delete user', 'error');
    }
}

// Save user (add or edit)
async function saveUser(event) {
    event.preventDefault();
    
    const saveBtn = document.getElementById('saveUser');
    const saveBtnText = document.getElementById('saveBtnText');
    const saveBtnSpinner = document.getElementById('saveBtnSpinner');
    
    const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value,
        status: document.getElementById('status').value
    };

    const password = document.getElementById('password').value;
    if (password) {
        formData.password = password;
    }

    saveBtn.disabled = true;
    saveBtnText.style.display = 'none';
    saveBtnSpinner.style.display = 'inline-block';

    try {
        const url = editingUserId ? `${API_URL}/api/users/${editingUserId}` : `${API_URL}/api/users`;
        const method = editingUserId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            showToast(`✅ User ${editingUserId ? 'updated' : 'created'} successfully`, 'success');
            closeUserModal();
            loadUsers(currentPage);
        } else {
            showToast(`❌ Failed to ${editingUserId ? 'update' : 'create'} user: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showToast(`❌ Failed to ${editingUserId ? 'update' : 'create'} user`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtnText.style.display = 'inline';
        saveBtnSpinner.style.display = 'none';
    }
}

// Close user modal
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    editingUserId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load initial users
    loadUsers();

    // Add user button
    document.getElementById('addUserBtn').addEventListener('click', openAddUserModal);

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', () => {
        const search = document.getElementById('searchInput').value;
        const role = document.getElementById('roleFilter').value;
        const status = document.getElementById('statusFilter').value;
        loadUsers(1, search, role, status);
    });

    // Enter key search
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });

    // User form submission
    document.getElementById('userForm').addEventListener('submit', saveUser);

    // Modal close buttons
    document.getElementById('closeUserModal').addEventListener('click', closeUserModal);
    document.getElementById('cancelUser').addEventListener('click', closeUserModal);

    // Close modal when clicking outside
    document.getElementById('userModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('userModal')) {
            closeUserModal();
        }
    });
});
