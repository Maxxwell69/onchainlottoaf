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
    return date.toLocaleString();
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
        const formData = {
            draw_name: document.getElementById('drawName').value,
            token_address: document.getElementById('tokenAddress').value,
            token_symbol: document.getElementById('tokenSymbol').value || null,
            min_usd_amount: parseFloat(document.getElementById('minUsdAmount').value),
            start_time: new Date(document.getElementById('startTime').value).toISOString()
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

// Refresh draws button
document.getElementById('refreshDrawsBtn').addEventListener('click', () => {
    showToast('🔄 Refreshing draws...', 'info');
    loadActiveDraws();
    loadAllDraws();
});

// Set default start time to now
document.getElementById('startTime').value = new Date().toISOString().slice(0, 16);

// Initial load
loadActiveDraws();
loadAllDraws();

