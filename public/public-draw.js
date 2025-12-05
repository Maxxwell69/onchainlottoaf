// Configuration
const API_URL = window.location.origin;

// Get draw ID from URL - support both ?id=X and /public-draw/X format
let drawId = null;
const urlParams = new URLSearchParams(window.location.search);
drawId = urlParams.get('id');

// If no ID in query, try to get from path
if (!drawId) {
    const pathParts = window.location.pathname.split('/');
    const drawIndex = pathParts.indexOf('public-draw');
    if (drawIndex !== -1 && pathParts[drawIndex + 1]) {
        drawId = pathParts[drawIndex + 1];
    }
}

if (!drawId) {
    document.body.innerHTML = '<div class="loading">❌ No draw ID specified. Please use a valid draw URL.</div>';
}

let currentDraw = null;
let currentEntries = [];

// Format functions - display times exactly as stored (no timezone conversion)
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
        
        // Display time exactly as stored (no timezone conversion)
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

function formatUSD(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function truncateAddress(address) {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
}

// Load draw data
async function loadDrawData() {
    try {
        const response = await fetch(`${API_URL}/api/draws/${drawId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load draw');
        }
        
        currentDraw = data.draw;
        currentEntries = data.draw.entries || [];
        
        // Update UI
        updateDrawInfo();
        updateProgressBar();
        renderNumbersGrid();
        
    } catch (error) {
        console.error('Error loading draw:', error);
        document.getElementById('drawTitle').textContent = 'Error Loading Draw';
        const loadingEl = document.querySelector('.loading');
        if (loadingEl) {
            loadingEl.textContent = `Error: ${error.message}`;
        }
    }
}

// Update draw info
function updateDrawInfo() {
    if (!currentDraw) return;
    
    document.getElementById('drawTitle').textContent = currentDraw.draw_name;
    document.getElementById('drawSubtitle').textContent = `Draw #${currentDraw.id}`;
    
    document.getElementById('tokenInfo').textContent = 
        `${currentDraw.token_symbol || 'Unknown'} (${truncateAddress(currentDraw.token_address)})`;
    
    const statusEl = document.getElementById('drawStatus');
    statusEl.textContent = currentDraw.status.toUpperCase();
    statusEl.className = `value status-badge status-${currentDraw.status}`;
    
    document.getElementById('filledSlots').textContent = 
        `${currentDraw.filled_slots} / ${currentDraw.total_slots}`;
    
    document.getElementById('startTime').textContent = formatDate(currentDraw.start_time);
    document.getElementById('endTime').textContent = formatDate(currentDraw.end_time);
}

// Update progress bar
function updateProgressBar() {
    if (!currentDraw) return;
    
    const percentage = (currentDraw.filled_slots / currentDraw.total_slots * 100).toFixed(1);
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${currentDraw.filled_slots} / ${currentDraw.total_slots} slots filled (${percentage}%)`;
}

// Render numbers grid (1-69) with balls and wallet addresses - sorted by purchase time
function renderNumbersGrid() {
    const grid = document.getElementById('numbersGrid');
    
    // Sort entries by timestamp (chronological order by purchase time)
    const sortedEntries = [...currentEntries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let html = '';
    
    // First, render all filled balls in chronological order by purchase time
    sortedEntries.forEach((entry, index) => {
        const walletDigits = entry.wallet_address.slice(-6);
        
        // Calculate time from draw start
        let timeFromStart = '';
        if (currentDraw) {
            const drawStart = new Date(currentDraw.start_time);
            const purchaseTime = new Date(entry.timestamp);
            const diffMs = purchaseTime.getTime() - drawStart.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            if (diffMinutes < 0) {
                timeFromStart = `${Math.abs(diffMinutes)} minutes before draw start`;
            } else if (diffMinutes === 0) {
                timeFromStart = 'At draw start';
            } else {
                timeFromStart = `${diffMinutes} minutes after draw start`;
            }
        }
        
        html += `
            <div class="number-ball-container">
                <div class="number-ball filled" 
                     title="Purchased ${timeFromStart} - $${entry.usd_amount}">
                    ${entry.lotto_number}
                </div>
                <div class="wallet-digits">${walletDigits}</div>
            </div>
        `;
    });
    
    // Then, render available balls (not yet purchased) in lotto number order
    const filledNumbers = currentEntries.map(entry => entry.lotto_number);
    for (let i = 1; i <= 69; i++) {
        if (!filledNumbers.includes(i)) {
            html += `
                <div class="number-ball-container">
                    <div class="number-ball available" title="Available">
                        ${i}
                    </div>
                </div>
            `;
        }
    }
    
    grid.innerHTML = html;
}

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Share functions
function shareDraw() {
    if (navigator.share) {
        navigator.share({
            title: `${currentDraw?.draw_name || 'Lotto Draw'}`,
            text: `Check out this On Chain Lotto draw!`,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        copyLink();
    }
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('✅ Link copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback: select text
        const input = document.createElement('input');
        input.value = window.location.href;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('✅ Link copied to clipboard!', 'success');
    });
}

// Auto-refresh every 30 seconds
setInterval(() => {
    loadDrawData();
}, 30000);

// Initial load
loadDrawData();
