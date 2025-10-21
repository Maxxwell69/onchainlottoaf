// Configuration
const API_URL = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const tokenId = urlParams.get('id');

if (!tokenId) {
    alert('No token ID specified');
    window.location.href = 'tokens.html';
}

let currentToken = null;
let currentBlacklist = [];

// Toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// Format functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function truncateAddress(address) {
    return `${address.substring(0, 12)}...${address.substring(address.length - 8)}`;
}

// Load token data
async function loadToken() {
    try {
        const response = await fetch(`${API_URL}/api/tokens/${tokenId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load token');
        }
        
        currentToken = data.token;
        currentBlacklist = data.token.blacklist;
        
        // Update UI
        document.getElementById('tokenTitle').textContent = `${currentToken.token_symbol || 'Unknown'} - Blacklist Manager`;
        document.getElementById('tokenAddress').textContent = currentToken.token_address;
        document.getElementById('tokenSymbol').textContent = currentToken.token_symbol || 'Unknown';
        document.getElementById('tokenStatus').textContent = currentToken.is_active ? 'Active' : 'Inactive';
        document.getElementById('blacklistCount').textContent = currentBlacklist.length;
        document.getElementById('blacklistBadge').textContent = currentBlacklist.length;
        
        renderBlacklist();
    } catch (error) {
        console.error('Error loading token:', error);
        showToast('❌ Failed to load token', 'error');
    }
}

// Render blacklist
function renderBlacklist() {
    const container = document.getElementById('blacklistTable');
    
    if (currentBlacklist.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No Blacklisted Wallets</h3>
                <p>Add wallets to prevent them from getting lotto numbers</p>
            </div>
        `;
        return;
    }
    
    const reasonBadges = {
        'liquidity_pool': '💧 Liquidity Pool',
        'bot': '🤖 Bot',
        'dex_wallet': '🔄 DEX Wallet',
        'contract': '📜 Contract',
        'suspicious': '⚠️ Suspicious',
        'manual': '✋ Manual',
        'bulk_add': '📋 Bulk'
    };
    
    container.innerHTML = `
        <div class="lotto-entries-list">
            ${currentBlacklist.map(entry => `
                <div class="lotto-entry" style="background: var(--card-bg);">
                    <div style="flex: 0 0 auto;">
                        <span class="status-badge status-cancelled">${reasonBadges[entry.reason] || entry.reason}</span>
                    </div>
                    <div class="entry-details">
                        <div class="entry-wallet">
                            <span class="wallet-address">${entry.wallet_address}</span>
                            <button class="copy-btn" onclick="copyToClipboard('${entry.wallet_address}', this)">
                                📋 Copy
                            </button>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                            <span class="entry-time">⏰ Added ${formatDate(entry.created_at)}</span>
                            ${entry.notes ? `<span style="color: var(--text-secondary); font-size: 0.875rem;">📝 ${entry.notes}</span>` : ''}
                            <button class="btn" style="background: var(--danger); color: white; font-size: 0.75rem; padding: 0.3rem 0.6rem;" onclick="removeFromBlacklist('${entry.wallet_address}')">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Copy to clipboard
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const original = button.innerHTML;
        button.innerHTML = '✓ Copied!';
        button.classList.add('copied');
        setTimeout(() => {
            button.innerHTML = original;
            button.classList.remove('copied');
        }, 2000);
    });
}

// Add to blacklist
document.getElementById('addBlacklistForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const wallet = document.getElementById('walletAddress').value;
    const reason = document.getElementById('reason').value;
    const notes = document.getElementById('notes').value;
    
    try {
        const response = await fetch(`${API_URL}/api/tokens/${tokenId}/blacklist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: wallet, reason, notes })
        });
        
        if (response.ok) {
            showToast('✅ Wallet blacklisted', 'success');
            document.getElementById('addBlacklistForm').reset();
            loadToken();
        } else {
            const data = await response.json();
            showToast(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showToast('❌ Failed to blacklist wallet', 'error');
    }
});

// Bulk add
document.getElementById('bulkBlacklistForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const walletsText = document.getElementById('bulkWallets').value;
    const reason = document.getElementById('bulkReason').value;
    
    // Parse wallets (one per line)
    const wallets = walletsText.split('\n')
        .map(w => w.trim())
        .filter(w => w.length > 0)
        .map(w => ({ wallet_address: w, reason }));
    
    if (wallets.length === 0) {
        showToast('❌ No wallets to add', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/tokens/${tokenId}/blacklist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallets })
        });
        
        if (response.ok) {
            showToast(`✅ ${wallets.length} wallets blacklisted`, 'success');
            document.getElementById('bulkBlacklistForm').reset();
            loadToken();
        } else {
            const data = await response.json();
            showToast(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showToast('❌ Failed to bulk blacklist', 'error');
    }
});

// Remove from blacklist
async function removeFromBlacklist(walletAddress) {
    if (!confirm(`Remove ${walletAddress.substring(0, 12)}... from blacklist?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/tokens/${tokenId}/blacklist/${walletAddress}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('✅ Removed from blacklist', 'success');
            loadToken();
        } else {
            showToast('❌ Failed to remove', 'error');
        }
    } catch (error) {
        showToast('❌ Failed to remove', 'error');
    }
}

// Initial load
loadToken();

