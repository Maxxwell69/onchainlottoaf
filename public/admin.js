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
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
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

// Create Draw Form Handler
document.getElementById('createDrawForm').addEventListener('submit', async (e) => {
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
                    <span class="detail-label">Min Purchase</span>
                    <span class="detail-value">${formatUSD(draw.min_usd_amount)}</span>
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
                    View Draw →
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
        if (data.tokens && data.tokens.length > 0) {
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

// Token dropdown change handler
document.getElementById('tokenSelect').addEventListener('change', (e) => {
    const value = e.target.value;
    if (value) {
        const token = JSON.parse(value);
        document.getElementById('tokenAddress').value = token.address;
        document.getElementById('tokenSymbol').value = token.symbol || '';
        
        // Auto-generate draw name if empty
        const drawNameField = document.getElementById('drawName');
        if (!drawNameField.value && token.symbol) {
            const now = new Date();
            drawNameField.value = `${token.symbol} Draw - ${now.toLocaleDateString()}`;
        }
    }
});

// Set default timezone and start time
document.getElementById('timezoneSelect').value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// Set start time to local computer time (not UTC)
const now = new Date();
const localTimeString = now.getFullYear() + '-' + 
    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
    String(now.getDate()).padStart(2, '0') + 'T' + 
    String(now.getHours()).padStart(2, '0') + ':' + 
    String(now.getMinutes()).padStart(2, '0');
document.getElementById('startTime').value = localTimeString;

// Timezone conversion removed - using local time directly

// Start from now button functionality
document.getElementById('startNowBtn').addEventListener('click', () => {
    const now = new Date();
    
    // Use local computer time (not UTC)
    const localTimeString = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + 'T' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('startTime').value = localTimeString;
    showToast('✅ Start time set to current local time', 'success');
});

// Initial load
loadActiveDraws();
loadAllDraws();
loadManagedTokens();

