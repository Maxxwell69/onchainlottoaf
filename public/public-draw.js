// Configuration
const API_URL = window.location.origin;

// Get draw ID from URL
const urlParams = new URLSearchParams(window.location.search);
const drawId = urlParams.get('id');

if (!drawId) {
    alert('No draw ID specified');
    window.location.href = 'index.html';
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

function truncateAddress(address) {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
}

// Get timezone abbreviation
function getTimezoneAbbreviation(timezone) {
    if (!timezone) return 'UTC';
    
    try {
        // Get current date in the specified timezone
        const date = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'short'
        });
        
        const parts = formatter.formatToParts(date);
        const timeZoneName = parts.find(part => part.type === 'timeZoneName');
        
        return timeZoneName ? timeZoneName.value : timezone;
    } catch (error) {
        // If timezone is invalid, return the timezone string or a shortened version
        return timezone.split('/').pop() || 'UTC';
    }
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
    
    // Display prize description if available
    const prizeDescriptionCard = document.getElementById('prizeDescriptionCard');
    const prizeDescriptionLong = document.getElementById('prizeDescriptionLong');
    if (prizeDescriptionCard && prizeDescriptionLong) {
        if (currentDraw.prize_description_long) {
            prizeDescriptionLong.textContent = currentDraw.prize_description_long;
            prizeDescriptionCard.style.display = 'block';
        } else {
            prizeDescriptionCard.style.display = 'none';
        }
    }
    
    document.getElementById('tokenInfo').textContent = 
        `${currentDraw.token_symbol || 'Unknown'} (${truncateAddress(currentDraw.token_address)})`;
    
    const statusEl = document.getElementById('drawStatus');
    statusEl.textContent = currentDraw.status.toUpperCase();
    statusEl.className = `value status-badge status-${currentDraw.status}`;
    
    document.getElementById('filledSlots').textContent = 
        `${currentDraw.filled_slots} / ${currentDraw.total_slots}`;
    
    // Display start time with timezone
    const startTimeDisplay = formatDate(currentDraw.start_time);
    const timezone = currentDraw.timezone || 'UTC';
    const timezoneAbbr = getTimezoneAbbreviation(timezone);
    document.getElementById('startTime').textContent = `${startTimeDisplay} (${timezoneAbbr})`;
    
    // Update contract address display
    updateContractAddress();
}

// Update contract address display
function updateContractAddress() {
    const contractAddressCard = document.getElementById('contractAddressCard');
    const contractAddressText = document.getElementById('contractAddressText');
    const dexscreenerLink = document.getElementById('dexscreenerLink');
    
    if (currentDraw && currentDraw.token_address) {
        if (contractAddressCard) contractAddressCard.style.display = 'block';
        if (contractAddressText) contractAddressText.textContent = currentDraw.token_address;
        if (dexscreenerLink) {
            dexscreenerLink.href = `https://dexscreener.com/solana/${currentDraw.token_address}`;
        }
    } else {
        if (contractAddressCard) contractAddressCard.style.display = 'none';
    }
}

// Copy contract address to clipboard
async function copyContractAddress() {
    if (!currentDraw || !currentDraw.token_address) {
        showToast('❌ No contract address to copy', 'error');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentDraw.token_address);
        showToast('✅ Contract address copied to clipboard!', 'success');
        
        // Visual feedback
        const contractAddressDisplay = document.getElementById('contractAddressDisplay');
        if (contractAddressDisplay) {
            contractAddressDisplay.style.background = 'var(--primary)';
            contractAddressDisplay.style.color = 'white';
            contractAddressDisplay.style.borderColor = 'var(--primary)';
            setTimeout(() => {
                contractAddressDisplay.style.background = 'var(--background)';
                contractAddressDisplay.style.color = '';
                contractAddressDisplay.style.borderColor = 'var(--border)';
            }, 500);
        }
    } catch (error) {
        console.error('Error copying address:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentDraw.token_address;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('✅ Contract address copied to clipboard!', 'success');
        } catch (err) {
            showToast('❌ Failed to copy address', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Make copyContractAddress available globally
window.copyContractAddress = copyContractAddress;

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
        const walletDigits = entry.wallet_address.slice(-6); // Last 6 digits of wallet
        
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
    
    // Apply theme styles to all balls (with a small delay to ensure DOM is ready)
    setTimeout(() => {
        applyThemeToBalls();
    }, 50);
}

// Apply theme styles to number balls
function applyThemeToBalls() {
    if (!window.themeManager) {
        // Fallback: ensure default golden style is applied
        const filledBalls = document.querySelectorAll('.number-ball.filled');
        filledBalls.forEach(ball => {
            if (!ball.style.background || ball.style.background === 'none') {
                ball.style.background = 'linear-gradient(135deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)';
                ball.style.color = '#000000';
                ball.style.borderColor = '#FFD700';
            }
        });
        return;
    }
    
    const filledBalls = document.querySelectorAll('.number-ball.filled');
    const availableBalls = document.querySelectorAll('.number-ball.available');
    
    filledBalls.forEach(ball => {
        window.themeManager.applyBallStyles(ball, 'filled');
    });
    
    availableBalls.forEach(ball => {
        window.themeManager.applyBallStyles(ball, 'available');
    });
}

// Listen for theme changes to re-render balls
window.addEventListener('themeChanged', () => {
    if (currentEntries && currentEntries.length > 0) {
        applyThemeToBalls();
    }
});

// Auto-refresh every 30 seconds
setInterval(async () => {
    console.log('Auto-refreshing draw data...');
    await loadDrawData();
}, 30000);

// Initial load
loadDrawData();




