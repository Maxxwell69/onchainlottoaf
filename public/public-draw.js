// Configuration
const API_URL = window.location.origin;

// Get draw ID from URL
const urlParams = new URLSearchParams(window.location.search);
const drawId = urlParams.get('id');

if (!drawId) {
    alert('No draw ID specified');
    window.location.href = 'home.html';
}

let currentDraw = null;
let currentEntries = [];

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Format functions - display times exactly as stored (no timezone conversion)
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        // Handle both formats: "YYYY-MM-DD HH:MM:SS" and "YYYY-MM-DDTHH:MM:SS.sssZ"
        let datePart, timePart;
        
        if (dateString.includes('T')) {
            // ISO format: "2025-10-17T23:30:00.000Z"
            // The Z means UTC, but we want to treat this as local time
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
        // This treats the time as if it's already in the correct timezone
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

// Format date only (no time) - for start time display
function formatDateOnly(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        // Handle both formats: "YYYY-MM-DD HH:MM:SS" and "YYYY-MM-DDTHH:MM:SS.sssZ"
        let datePart;
        
        if (dateString.includes('T')) {
            // ISO format: "2025-10-17T23:30:00.000Z"
            datePart = dateString.split('T')[0];
        } else {
            // Space format: "2025-10-17 23:30:00"
            [datePart] = dateString.split(' ');
        }
        
        const [year, month, day] = datePart.split('-');
        
        // Create date using local timezone
        const date = new Date(year, month - 1, day);
        
        // Display date only (no time)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
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

function formatTokenAmount(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
    }).format(amount / 1e9); // Assuming 9 decimals
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
        showToast('❌ Failed to load draw data', 'error');
    }
}

// Update draw info
function updateDrawInfo() {
    document.getElementById('drawTitle').textContent = currentDraw.draw_name;
    document.getElementById('drawSubtitle').textContent = `Draw #${currentDraw.id}`;
    
    document.getElementById('tokenInfo').textContent = 
        `${currentDraw.token_symbol || 'Unknown'} (${truncateAddress(currentDraw.token_address)})`;
    
    document.getElementById('minPurchase').textContent = formatUSD(currentDraw.min_usd_amount);
    
    const statusEl = document.getElementById('drawStatus');
    statusEl.textContent = currentDraw.status.toUpperCase();
    statusEl.className = `value status-badge status-${currentDraw.status}`;
    
    document.getElementById('filledSlots').textContent = 
        `${currentDraw.filled_slots} / ${currentDraw.total_slots}`;
    
    // Use formatDateOnly for start time (date only, no time)
    document.getElementById('startTime').textContent = formatDateOnly(currentDraw.start_time);
    document.getElementById('endTime').textContent = formatDate(currentDraw.end_time);
}

// Update progress bar
function updateProgressBar() {
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


// Auto-refresh every 30 seconds
setInterval(async () => {
    console.log('Auto-refreshing draw data...');
    await loadDrawData();
}, 30000);

// Initial load
loadDrawData();
