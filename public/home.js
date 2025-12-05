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

// Load active draws for home page
async function loadActiveDraws() {
    const container = document.getElementById('activeDrawsContainer');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/api/draws/active`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load draws');
        }
        
        const draws = data.draws || [];
        displayActiveDraws(draws);
        
    } catch (error) {
        console.error('Error loading active draws:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p>Unable to load active draws at this time. Please try again later.</p>
            </div>
        `;
    }
}

// Display active draws on home page (show max 3)
function displayActiveDraws(draws) {
    const container = document.getElementById('activeDrawsContainer');
    if (!container) return;
    
    if (draws.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h1 class="empty-state-title">More Draws Coming Soon</h1>
            </div>
        `;
        return;
    }
    
    // Show all draws on home page (no limit)
    const displayDraws = draws;
    
    const drawsGrid = document.createElement('div');
    drawsGrid.className = 'home-draws-grid';
    
    displayDraws.forEach(draw => {
        const progress = ((draw.filled_slots || 0) / (draw.total_slots || 69)) * 100;
        const progressPercent = Math.round(progress);
        
        const drawCard = document.createElement('div');
        drawCard.className = 'home-draw-card';
        
        drawCard.innerHTML = `
            <div class="home-draw-card-header">
                <h3 class="home-draw-card-title">${draw.draw_name || 'Lotto Draw'}</h3>
                <span class="home-draw-status active">${draw.status?.toUpperCase() || 'ACTIVE'}</span>
            </div>
            
            <div class="home-draw-card-info">
                <div class="home-draw-info-item">
                    <div class="home-draw-info-label">Token</div>
                    <div class="home-draw-info-value">${draw.token_symbol || truncateAddress(draw.token_address)}</div>
                </div>
                <div class="home-draw-info-item">
                    <div class="home-draw-info-label">Filled Slots</div>
                    <div class="home-draw-info-value">${draw.filled_slots || 0} / ${draw.total_slots || 69}</div>
                </div>
            </div>
            
            <div class="home-draw-progress">
                <div class="home-draw-progress-bar">
                    <div class="home-draw-progress-fill" style="width: ${progressPercent}%">${progressPercent}%</div>
                </div>
                <div class="home-draw-progress-text">
                    ${draw.filled_slots || 0} of ${draw.total_slots || 69} slots filled
                </div>
            </div>
            
            <div class="home-draw-card-info">
                <div class="home-draw-info-item">
                    <div class="home-draw-info-label">Start Time</div>
                    <div class="home-draw-info-value" style="font-size: 0.9em;">${formatDate(draw.start_time)}</div>
                </div>
            </div>
            
            <div class="home-draw-card-footer">
                <a href="/public-draw/${draw.id}" class="home-draw-link" onclick="event.stopPropagation();">
                    View Draw Details →
                </a>
            </div>
        `;
        
        // Make entire card clickable
        drawCard.onclick = () => {
            window.location.href = `/public-draw/${draw.id}`;
        };
        
        drawsGrid.appendChild(drawCard);
    });
    
    container.innerHTML = '';
    container.appendChild(drawsGrid);
}

// Load archive (completed) draws
async function loadArchiveDraws() {
    const container = document.getElementById('archiveDrawsContainer');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/api/draws`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load draws');
        }
        
        // Filter for completed draws
        const completedDraws = (data.draws || []).filter(draw => 
            draw.status === 'completed' || draw.status === 'cancelled'
        );
        
        displayArchiveDraws(completedDraws);
        
    } catch (error) {
        console.error('Error loading archive draws:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p>Unable to load archive draws at this time.</p>
            </div>
        `;
    }
}

// Display archive draws
function displayArchiveDraws(draws) {
    const container = document.getElementById('archiveDrawsContainer');
    if (!container) return;
    
    if (draws.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No completed draws in archive yet.</p>
            </div>
        `;
        return;
    }
    
    const drawsGrid = document.createElement('div');
    drawsGrid.className = 'home-draws-grid';
    
    draws.forEach(draw => {
        const progress = ((draw.filled_slots || 0) / (draw.total_slots || 69)) * 100;
        const progressPercent = Math.round(progress);
        
        const drawCard = document.createElement('div');
        drawCard.className = 'home-draw-card archive-card';
        
        drawCard.innerHTML = `
            <div class="home-draw-card-header">
                <h3 class="home-draw-card-title">${draw.draw_name || 'Lotto Draw'}</h3>
                <span class="home-draw-status ${draw.status}">${draw.status?.toUpperCase() || 'COMPLETED'}</span>
            </div>
            
            <div class="home-draw-card-info">
                <div class="home-draw-info-item">
                    <div class="home-draw-info-label">Token</div>
                    <div class="home-draw-info-value">${draw.token_symbol || truncateAddress(draw.token_address)}</div>
                </div>
                <div class="home-draw-info-item">
                    <div class="home-draw-info-label">Filled Slots</div>
                    <div class="home-draw-info-value">${draw.filled_slots || 0} / ${draw.total_slots || 69}</div>
                </div>
            </div>
            
            <div class="home-draw-progress">
                <div class="home-draw-progress-bar">
                    <div class="home-draw-progress-fill" style="width: ${progressPercent}%">${progressPercent}%</div>
                </div>
                <div class="home-draw-progress-text">
                    ${draw.filled_slots || 0} of ${draw.total_slots || 69} slots filled
                </div>
            </div>
            
            <div class="home-draw-card-info">
                <div class="home-draw-info-item">
                    <div class="home-draw-info-label">Start Time</div>
                    <div class="home-draw-info-value" style="font-size: 0.9em;">${formatDate(draw.start_time)}</div>
                </div>
                ${draw.end_time ? `
                <div class="home-draw-info-item">
                    <div class="home-draw-info-label">End Time</div>
                    <div class="home-draw-info-value" style="font-size: 0.9em;">${formatDate(draw.end_time)}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="home-draw-card-footer">
                <a href="/public-draw/${draw.id}" class="home-draw-link" onclick="event.stopPropagation();">
                    View Draw Details →
                </a>
            </div>
        `;
        
        // Make entire card clickable
        drawCard.onclick = () => {
            window.location.href = `/public-draw/${draw.id}`;
        };
        
        drawsGrid.appendChild(drawCard);
    });
    
    container.innerHTML = '';
    container.appendChild(drawsGrid);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadActiveDraws();
    loadArchiveDraws();
    
    // Refresh every 60 seconds
    setInterval(loadActiveDraws, 60000);
});

