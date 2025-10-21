// Configuration
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

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Truncate address
function truncateAddress(address) {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
}

// Add Token Form
document.getElementById('addTokenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const btnText = document.getElementById('addTokenBtnText');
    const spinner = document.getElementById('addTokenSpinner');
    
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    
    try {
        const formData = {
            token_address: document.getElementById('tokenAddress').value,
            token_symbol: document.getElementById('tokenSymbol').value || null,
            token_name: document.getElementById('tokenName').value || null,
            notes: document.getElementById('tokenNotes').value || null
        };
        
        const response = await fetch(`${API_URL}/api/tokens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('✅ Token added successfully!', 'success');
            document.getElementById('addTokenForm').reset();
            loadTokens();
        } else {
            showToast(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Error adding token:', error);
        showToast('❌ Failed to add token', 'error');
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
});

// Render token item
function renderToken(token) {
    return `
        <div class="draw-item">
            <div class="draw-header">
                <div class="draw-title">${token.token_symbol || 'Unknown'} - ${token.token_name || 'No Name'}</div>
                <span class="status-badge ${token.is_active ? 'status-active' : 'status-cancelled'}">
                    ${token.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="draw-details">
                <div class="detail-item">
                    <span class="detail-label">Token Address</span>
                    <span class="detail-value" style="font-family: monospace; font-size: 0.85rem;">${token.token_address}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Blacklisted Wallets</span>
                    <span class="detail-value">${token.blacklist_count || 0}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Created</span>
                    <span class="detail-value">${formatDate(token.created_at)}</span>
                </div>
                ${token.notes ? `
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <span class="detail-label">Notes</span>
                        <span class="detail-value">${token.notes}</span>
                    </div>
                ` : ''}
            </div>
            <div class="draw-actions">
                <button class="btn btn-primary" onclick="window.location.href='token-detail.html?id=${token.id}'">
                    Manage Blacklist →
                </button>
                <button class="btn btn-secondary" onclick="toggleTokenStatus(${token.id}, ${!token.is_active})">
                    ${token.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                </button>
                <button class="btn" style="background: var(--danger); color: white;" onclick="deleteToken(${token.id}, '${token.token_symbol || 'this token'}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
}

// Load tokens
async function loadTokens() {
    const container = document.getElementById('tokensList');
    
    try {
        const response = await fetch(`${API_URL}/api/tokens`);
        const data = await response.json();
        
        if (data.tokens && data.tokens.length > 0) {
            // Get blacklist counts
            const tokensWithCounts = await Promise.all(
                data.tokens.map(async (token) => {
                    const res = await fetch(`${API_URL}/api/tokens/${token.id}`);
                    const detail = await res.json();
                    return { ...token, blacklist_count: detail.token.blacklist.length };
                })
            );
            
            container.innerHTML = tokensWithCounts.map(token => renderToken(token)).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Tokens Yet</h3>
                    <p>Add your first token to start managing blacklists</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading tokens:', error);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Error Loading Tokens</h3>
                <p>Please check your connection</p>
            </div>
        `;
    }
}

// Toggle token status
async function toggleTokenStatus(tokenId, active) {
    try {
        const response = await fetch(`${API_URL}/api/tokens/${tokenId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: active })
        });
        
        if (response.ok) {
            showToast(`✅ Token ${active ? 'activated' : 'deactivated'}`, 'success');
            loadTokens();
        } else {
            showToast('❌ Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('❌ Failed to update status', 'error');
    }
}

// Delete token
async function deleteToken(tokenId, tokenSymbol) {
    if (!confirm(`⚠️ Delete ${tokenSymbol}?\n\nThis will also delete all blacklist entries for this token.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/tokens/${tokenId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('✅ Token deleted', 'success');
            loadTokens();
        } else {
            showToast('❌ Failed to delete', 'error');
        }
    } catch (error) {
        console.error('Error deleting token:', error);
        showToast('❌ Failed to delete', 'error');
    }
}

// Refresh button
document.getElementById('refreshTokensBtn').addEventListener('click', () => {
    showToast('🔄 Refreshing...', 'info');
    loadTokens();
});

// Initial load
loadTokens();

