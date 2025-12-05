// Configuration
const API_URL = window.location.origin;

// Format functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        let datePart, timePart;
        
        if (dateString.includes('T')) {
            const isoDate = dateString.split('T')[0];
            const isoTime = dateString.split('T')[1].split('.')[0];
            datePart = isoDate;
            timePart = isoTime;
        } else {
            [datePart, timePart] = dateString.split(' ');
        }
        
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
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
        console.error('Error formatting date:', error);
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

// Load active draws
async function loadActiveDraws() {
    try {
        const response = await fetch(`${API_URL}/api/draws/active`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load draws');
        }
        
        const draws = data.draws || [];
        displayDraws(draws);
        
    } catch (error) {
        console.error('Error loading draws:', error);
        document.getElementById('drawsContainer').innerHTML = `
            <div class="empty-state">
                <h2>❌ Error Loading Draws</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Display draws in grid
function displayDraws(draws) {
    const container = document.getElementById('drawsContainer');
    
    if (draws.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>🎰 No Active Draws</h2>
                <p>There are currently no active lotto draws. Check back soon!</p>
            </div>
        `;
        return;
    }
    
    const drawsGrid = document.createElement('div');
    drawsGrid.className = 'draws-grid';
    
    draws.forEach(draw => {
        const progress = ((draw.filled_slots || 0) / (draw.total_slots || 69)) * 100;
        const progressPercent = Math.round(progress);
        
        const drawCard = document.createElement('div');
        drawCard.className = 'draw-card';
        drawCard.onclick = () => {
            window.location.href = `/public-draw/${draw.id}`;
        };
        
        drawCard.innerHTML = `
            <div class="draw-card-header">
                <h3 class="draw-card-title">${draw.draw_name || 'Lotto Draw'}</h3>
                <span class="draw-card-status active">${draw.status?.toUpperCase() || 'ACTIVE'}</span>
            </div>
            
            <div class="draw-card-info">
                <div class="draw-info-item">
                    <div class="draw-info-label">Token</div>
                    <div class="draw-info-value">${draw.token_symbol || truncateAddress(draw.token_address)}</div>
                </div>
                <div class="draw-info-item">
                    <div class="draw-info-label">Filled Slots</div>
                    <div class="draw-info-value">${draw.filled_slots || 0} / ${draw.total_slots || 69}</div>
                </div>
            </div>
            
            <div class="draw-progress">
                <div class="draw-progress-bar">
                    <div class="draw-progress-fill" style="width: ${progressPercent}%">
                        ${progressPercent}%
                    </div>
                </div>
                <div class="draw-progress-text">
                    ${draw.filled_slots || 0} of ${draw.total_slots || 69} slots filled
                </div>
            </div>
            
            <div class="draw-card-info">
                <div class="draw-info-item">
                    <div class="draw-info-label">Start Time</div>
                    <div class="draw-info-value" style="font-size: 0.9em;">${formatDate(draw.start_time)}</div>
                </div>
                ${draw.end_time ? `
                <div class="draw-info-item">
                    <div class="draw-info-label">End Time</div>
                    <div class="draw-info-value" style="font-size: 0.9em;">${formatDate(draw.end_time)}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="draw-card-footer">
                <a href="/public-draw/${draw.id}" class="view-draw-btn" onclick="event.stopPropagation();">
                    View Draw Details →
                </a>
            </div>
        `;
        
        drawsGrid.appendChild(drawCard);
    });
    
    container.innerHTML = '';
    container.appendChild(drawsGrid);
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

// Auto-refresh every 60 seconds
setInterval(() => {
    loadActiveDraws();
}, 60000);

// Initial load
loadActiveDraws();

