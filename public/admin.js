// Configuration
const API_URL = window.location.origin;

// Toast notification function
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
    
    try {
        // Handle both formats: "YYYY-MM-DD HH:MM:SS" and "YYYY-MM-DDTHH:MM:SS.sssZ"
        let datePart, timePart;
        
        if (dateString.includes('T')) {
            // ISO format: "2025-10-17T23:30:00.000Z"
            const isoDate = dateString.split('T')[0];
            const isoTime = dateString.split('T')[1].split('.')[0]; // Remove milliseconds and Z
            datePart = isoDate;
            timePart = isoTime;
        } else {
            // Space format: "2025-10-17 23:30:00"
            [datePart, timePart] = dateString.split(' ');
        }
        
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        // Create date using local timezone but with the exact values
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
        console.error('Error formatting date:', error, 'Input:', dateString);
        return 'Invalid Date';
    }
}

// Format USD
function formatUSD(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Truncate address
function truncateAddress(address) {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Initialize role-based UI
function initRoleBasedUI() {
    const user = authManager.getCurrentUser();
    if (!user) return;
    
    const isModerator = user.role === 'moderator' || user.role === 'admin' || user.role === 'super_admin';
    
    // Show/hide create draw form based on role
    const createDrawCard = document.getElementById('createDrawCard');
    if (createDrawCard) {
        createDrawCard.style.display = isModerator ? 'block' : 'none';
    }
}

// Create Draw Form Handler (only if form exists)
const createDrawForm = document.getElementById('createDrawForm');
if (createDrawForm) {
    createDrawForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const createBtn = document.getElementById('createBtn');
    const btnText = document.getElementById('createBtnText');
    const btnSpinner = document.getElementById('createBtnSpinner');
    
    // Disable button and show spinner
    createBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    
    try {
        const timezone = document.getElementById('timezoneSelect').value;
        const startTimeValue = document.getElementById('startTime').value;
        
        // Convert EST time to proper format for storage
        // The datetime-local input gives us a string like "2025-10-17T23:30"
        // We need to store it as a timezone-naive timestamp
        // Format: YYYY-MM-DD HH:MM:SS (space instead of T)
        const startTimeEST = startTimeValue.replace('T', ' ') + ':00';
        
        const formData = {
            draw_name: document.getElementById('drawName').value,
            token_address: document.getElementById('tokenAddress').value,
            token_symbol: document.getElementById('tokenSymbol').value || null,
            min_usd_amount: parseFloat(document.getElementById('minUsdAmount').value),
            start_time: startTimeEST,
            timezone: timezone
        };
        
        const response = await fetch(`${API_URL}/api/draws`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('✅ Lotto draw created successfully!', 'success');
            document.getElementById('createDrawForm').reset();
            
            // Redirect to draw page
            setTimeout(() => {
                window.location.href = `draw.html?id=${data.draw.id}`;
            }, 1500);
        } else {
            showToast(`❌ Error: ${data.error || 'Failed to create draw'}`, 'error');
        }
    } catch (error) {
        console.error('Error creating draw:', error);
        showToast('❌ Failed to create draw. Check console for details.', 'error');
    } finally {
        createBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
    });
}

// Render draw item
function renderDrawItem(draw) {
    const progress = (draw.filled_slots / draw.total_slots * 100).toFixed(1);
    
    return `
        <div class="draw-item">
            <div class="draw-header">
                <div class="draw-title">${draw.draw_name}</div>
                <span class="status-badge status-${draw.status}">${draw.status}</span>
            </div>
            <div class="draw-details">
                <div class="detail-item">
                    <span class="detail-label">Token</span>
                    <span class="detail-value">${draw.token_symbol || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Progress</span>
                    <span class="detail-value">${draw.filled_slots}/${draw.total_slots} (${progress}%)</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Start Time</span>
                    <span class="detail-value">${formatDate(draw.start_time)}</span>
                </div>
            </div>
                <div class="draw-actions">
                <button class="btn btn-primary" onclick="window.location.href='draw.html?id=${draw.id}'">
                    🔧 Admin View →
                </button>
                <button class="btn btn-secondary" onclick="window.location.href='public-draw.html?id=${draw.id}'" style="background: var(--primary); color: white;">
                    🌐 Public View →
                </button>
                ${draw.status === 'active' ? `
                    <button class="btn btn-secondary" onclick="scanDraw(${draw.id})">
                        🔍 Scan Now
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="clearScanHistory(${draw.id}, '${draw.draw_name.replace(/'/g, "\\'")}')">
                    🧹 Clear History
                </button>
                <button class="btn" style="background: var(--danger); color: white;" onclick="deleteDraw(${draw.id}, '${draw.draw_name.replace(/'/g, "\\'")}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
}

// Load active draws
async function loadActiveDraws() {
    const container = document.getElementById('activeDrawsList');
    
    try {
        const response = await fetch(`${API_URL}/api/draws/active`);
        const data = await response.json();
        
        if (data.draws && data.draws.length > 0) {
            container.innerHTML = data.draws.map(draw => renderDrawItem(draw)).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Active Draws</h3>
                    <p>Create a new draw to get started!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading active draws:', error);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Error Loading Draws</h3>
                <p>Please check your API connection</p>
            </div>
        `;
    }
}

// Load all draws
async function loadAllDraws() {
    const container = document.getElementById('allDrawsList');
    
    try {
        const response = await fetch(`${API_URL}/api/draws`);
        const data = await response.json();
        
        if (data.draws && data.draws.length > 0) {
            container.innerHTML = data.draws.map(draw => renderDrawItem(draw)).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Draws Yet</h3>
                    <p>Create your first draw above!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading all draws:', error);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Error Loading Draws</h3>
                <p>Please check your API connection</p>
            </div>
        `;
    }
}

// Scan draw
async function scanDraw(drawId) {
  showToast('🔍 Scanning for new buys...', 'info');
  
  try {
    const response = await fetch(`${API_URL}/api/draws/${drawId}/scan`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast(`✅ Scan complete! Found ${data.result.newEntries} new entries`, 'success');
      loadActiveDraws();
      loadAllDraws();
    } else {
      showToast(`❌ Scan failed: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error scanning draw:', error);
    showToast('❌ Failed to scan draw', 'error');
  }
}

// Delete draw
async function deleteDraw(drawId, drawName) {
  if (!confirm(`⚠️ Are you sure you want to delete "${drawName}"?\n\nThis will permanently delete:\n- The draw\n- All ${drawName} entries (lotto numbers)\n- All scan history\n\nThis action cannot be undone!`)) {
    return;
  }
  
  showToast('🗑️ Deleting draw...', 'info');
  
  try {
    const response = await fetch(`${API_URL}/api/draws/${drawId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('✅ Draw deleted successfully', 'success');
      loadActiveDraws();
      loadAllDraws();
    } else {
      showToast(`❌ Delete failed: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error deleting draw:', error);
    showToast('❌ Failed to delete draw', 'error');
  }
}

// Clear scan history
async function clearScanHistory(drawId, drawName) {
  if (!confirm(`Clear scan history for "${drawName}"?\n\nThis will remove all scan records but keep the draw and entries.`)) {
    return;
  }
  
  showToast('🧹 Clearing scan history...', 'info');
  
  try {
    const response = await fetch(`${API_URL}/api/draws/${drawId}/scan-history`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast(`✅ Cleared ${data.deletedRecords} scan records`, 'success');
    } else {
      showToast(`❌ Failed: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error clearing scan history:', error);
    showToast('❌ Failed to clear scan history', 'error');
  }
}

// Refresh draws button
document.getElementById('refreshDrawsBtn').addEventListener('click', () => {
    showToast('🔄 Refreshing draws...', 'info');
    loadActiveDraws();
    loadAllDraws();
});

// Load managed tokens for dropdown
async function loadManagedTokens() {
    try {
        const response = await fetch(`${API_URL}/api/tokens`);
        const data = await response.json();
        
        const select = document.getElementById('tokenSelect');
        if (select && data.tokens && data.tokens.length > 0) {
            // Add managed tokens to dropdown
            data.tokens.forEach(token => {
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    address: token.token_address,
                    symbol: token.token_symbol,
                    name: token.token_name
                });
                option.textContent = `${token.token_symbol || 'Unknown'} - ${token.token_name || 'No Name'}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading managed tokens:', error);
    }
}

// Token dropdown change handler (only if element exists)
const tokenSelect = document.getElementById('tokenSelect');
if (tokenSelect) {
    tokenSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        if (value) {
            const token = JSON.parse(value);
            const tokenAddressField = document.getElementById('tokenAddress');
            const tokenSymbolField = document.getElementById('tokenSymbol');
            
            if (tokenAddressField) tokenAddressField.value = token.address;
            if (tokenSymbolField) tokenSymbolField.value = token.symbol || '';
            
            // Auto-generate draw name if empty
            const drawNameField = document.getElementById('drawName');
            if (drawNameField && !drawNameField.value && token.symbol) {
                const now = new Date();
                drawNameField.value = `${token.symbol} Draw - ${now.toLocaleDateString()}`;
            }
        }
    });
}

// Set default timezone and start time
// Initialize form elements (only if they exist - for moderators+)
const timezoneSelect = document.getElementById('timezoneSelect');
const startTimeInput = document.getElementById('startTime');
const startNowBtn = document.getElementById('startNowBtn');

if (timezoneSelect) {
    timezoneSelect.value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

if (startTimeInput) {
    // Set start time to local computer time (not UTC)
    const now = new Date();
    const localTimeString = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + 'T' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0');
    startTimeInput.value = localTimeString;
}

// Start from now button functionality (only if button exists)
if (startNowBtn) {
    startNowBtn.addEventListener('click', () => {
        const now = new Date();
        
        // Use local computer time (not UTC)
        const localTimeString = now.getFullYear() + '-' + 
            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
            String(now.getDate()).padStart(2, '0') + 'T' + 
            String(now.getHours()).padStart(2, '0') + ':' + 
            String(now.getMinutes()).padStart(2, '0');
        
        if (startTimeInput) {
            startTimeInput.value = localTimeString;
        }
        showToast('✅ Start time set to current local time', 'success');
    });
}

// Initialize role-based UI and load data
document.addEventListener('DOMContentLoaded', () => {
    initRoleBasedUI();
    loadActiveDraws();
    loadAllDraws();
    
    // Only load tokens if user is moderator+ (for the form dropdown)
    const user = authManager.getCurrentUser();
    if (user && (user.role === 'moderator' || user.role === 'admin' || user.role === 'super_admin')) {
        loadManagedTokens();
    }
});

