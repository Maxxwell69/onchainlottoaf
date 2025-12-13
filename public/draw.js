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
        // Display prize description if available
        const prizeDescriptionCard = document.getElementById('prizeDescriptionCard');
        const prizeDescriptionLong = document.getElementById('prizeDescriptionLong');
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
        renderEntriesTable();
        updateDrawManagementButtons();
        setupDrawManagementButtons();
        setupPrizeEdit();
        
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
    const editPrizeBtn = document.getElementById('editPrizeBtn');
    const editPrizeForm = document.getElementById('editPrizeForm');
    
    if (prizeDescriptionCard && prizeDescriptionLong) {
        if (currentDraw.prize_description_short || currentDraw.prize_description_long) {
            // Show long description if available, otherwise show short
            if (currentDraw.prize_description_long) {
                prizeDescriptionLong.textContent = currentDraw.prize_description_long;
            } else if (currentDraw.prize_description_short) {
                prizeDescriptionLong.textContent = currentDraw.prize_description_short;
            }
            prizeDescriptionCard.style.display = 'block';
            
            // Ensure form is hidden and button is visible
            if (editPrizeForm) editPrizeForm.style.display = 'none';
            if (prizeDescriptionLong) prizeDescriptionLong.style.display = 'block';
            if (editPrizeBtn) editPrizeBtn.style.display = 'inline-block';
        } else {
            // Show card even if no description, so admin can add one
            prizeDescriptionCard.style.display = 'block';
            prizeDescriptionLong.textContent = 'No prize description set. Click "Edit Prize" to add one.';
            prizeDescriptionLong.style.opacity = '0.7';
            
            // Ensure form is hidden and button is visible
            if (editPrizeForm) editPrizeForm.style.display = 'none';
            if (prizeDescriptionLong) prizeDescriptionLong.style.display = 'block';
            if (editPrizeBtn) editPrizeBtn.style.display = 'inline-block';
        }
    }
    
    // Update public link button
    const publicLinkBtn = document.getElementById('publicLinkBtn');
    if (publicLinkBtn) {
        publicLinkBtn.href = `public-draw.html?id=${drawId}`;
        publicLinkBtn.target = '_blank';
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
    
    // Apply theme styles to all balls (with a small delay to ensure DOM is ready)
    setTimeout(() => {
        applyThemeToBalls();
    }, 50);
}

// Manual Add Transaction functionality
function openManualAddModal() {
    const modal = document.getElementById('manualAddModal');
    modal.style.display = 'flex';
    
    // Set default time to current time in EST
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const timeString = estTime.toISOString().slice(0, 16);
    document.getElementById('transactionTime').value = timeString;
}

function closeManualAddModal() {
    const modal = document.getElementById('manualAddModal');
    modal.style.display = 'none';
    
    // Clear form
    document.getElementById('manualAddForm').reset();
}

async function submitManualAddTransaction() {
    try {
        const form = document.getElementById('manualAddForm');
        const formData = new FormData(form);
        
        const transactionTime = document.getElementById('transactionTime').value;
        const walletAddress = document.getElementById('walletAddress').value.trim();
        const transactionSignature = document.getElementById('transactionSignature').value.trim();
        const tokenAmount = parseFloat(document.getElementById('tokenAmount').value);
        const usdAmount = parseFloat(document.getElementById('usdAmount').value);
        const notes = document.getElementById('notes').value.trim();
        
        // Validation
        if (!transactionTime || !walletAddress || !transactionSignature || !tokenAmount || !usdAmount) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Convert EST time to proper format
        // The datetime-local input gives us a string like "2025-10-17T23:30"
        // We need to store it as a timezone-naive timestamp
        // Format: YYYY-MM-DD HH:MM:SS (space instead of T)
        const timestamp = transactionTime.replace('T', ' ') + ':00';
        
        // Show loading state
        const submitBtn = document.getElementById('submitManualAdd');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Adding...';
        submitBtn.disabled = true;
        
        // Get auth headers
        if (!authManager.isAuthenticated()) {
            showToast('❌ You must be logged in to add entries', 'error');
            window.location.href = '/login.html';
            return;
        }
        
        const authHeaders = authManager.getAuthHeaders();
        
        // Submit to API
        const response = await fetch('/api/manual-entries/add', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                drawId: currentDraw.id,
                walletAddress: walletAddress,
                transactionSignature: transactionSignature,
                tokenAmount: tokenAmount,
                usdAmount: usdAmount,
                transactionTime: timestamp,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Transaction added successfully!', 'success');
            closeManualAddModal();
            
            // Refresh the page to show the new transaction
            await loadDrawData();
        } else {
            showToast(result.error || 'Failed to add transaction', 'error');
        }
        
    } catch (error) {
        console.error('Error adding manual transaction:', error);
        showToast('Error adding transaction', 'error');
    } finally {
        // Reset button state
        const submitBtn = document.getElementById('submitManualAdd');
        submitBtn.textContent = 'Add Transaction';
        submitBtn.disabled = false;
    }
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

// Copy wallet address to clipboard
function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '✓ Copied!';
        buttonElement.classList.add('copied');
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy address', 'error');
    });
}

// Render entries with lotto balls
function renderEntriesTable() {
    const entriesList = document.getElementById('lottoEntriesList');
    const countBadge = document.getElementById('entriesCount');
    
    countBadge.textContent = currentEntries.length;
    
    if (currentEntries.length === 0) {
        entriesList.innerHTML = `
            <div class="empty-state">
                <h3>No Entries Yet</h3>
                <p>Use the "Scan for New Buys" button to check for qualifying transactions</p>
            </div>
        `;
        return;
    }
    
    // Sort by timestamp (chronological - oldest to newest)
    const sortedEntries = [...currentEntries].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    entriesList.innerHTML = sortedEntries.map(entry => `
        <div class="lotto-entry">
            <div class="lotto-ball">
                ${entry.lotto_number}
            </div>
            <div class="entry-details">
                <div class="entry-amount">
                    ${formatUSD(entry.usd_amount)}
                </div>
                <div class="entry-wallet">
                    <span class="wallet-address">${entry.wallet_address}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${entry.wallet_address}', this)">
                        📋 Copy
                    </button>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <span class="entry-time">⏰ ${formatDate(entry.timestamp)}</span>
                    <a href="https://solscan.io/tx/${entry.transaction_signature}" 
                       target="_blank" 
                       class="entry-tx-link">
                        🔍 View Transaction
                    </a>
                </div>
            </div>
        </div>
    `).join('');
    
    // Apply theme styles to lotto balls (with delay to ensure DOM is ready)
    setTimeout(() => {
        applyThemeToLottoBalls();
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

// Apply theme styles to lotto balls in entry list
function applyThemeToLottoBalls() {
    const lottoBalls = document.querySelectorAll('.lotto-ball');
    
    if (!window.themeManager) {
        // Fallback: ensure default golden style is applied
        lottoBalls.forEach(ball => {
            if (!ball.style.background || ball.style.background === 'none' || ball.style.background === 'transparent') {
                ball.style.background = 'linear-gradient(135deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)';
                ball.style.color = '#000000';
                ball.style.borderColor = '#FFD700';
                ball.style.borderWidth = '2px';
                ball.style.borderStyle = 'solid';
            }
        });
        return;
    }
    
    lottoBalls.forEach(ball => {
        window.themeManager.applyBallStyles(ball, 'filled');
        
        // Ensure ball is visible even if theme application fails
        if (!ball.style.background || ball.style.background === 'none' || ball.style.background === 'transparent') {
            ball.style.background = 'linear-gradient(135deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)';
            ball.style.color = '#000000';
            ball.style.borderColor = '#FFD700';
        }
    });
}

// Scan for new buys using DexScreener (ALWAYS works)
document.getElementById('scanDexBtn').addEventListener('click', async () => {
    const scanBtn = document.getElementById('scanDexBtn');
    const btnText = document.getElementById('scanDexBtnText');
    const btnSpinner = document.getElementById('scanDexBtnSpinner');
    
    scanBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    
    showToast('🔍 Scanning for new qualifying buys...', 'info');
    
    try {
        // Get auth headers
        if (!authManager.isAuthenticated()) {
            showToast('❌ You must be logged in to scan', 'error');
            window.location.href = '/login.html';
            return;
        }
        
        const authHeaders = authManager.getAuthHeaders();
        
        const response = await fetch(`${API_URL}/api/draws/${drawId}/scan-dex`, {
            method: 'POST',
            headers: authHeaders
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const { newEntries, qualifyingTransactions } = data.result;
            
            if (newEntries > 0) {
                showToast(`✅ Found ${newEntries} new qualifying entries!`, 'success');
            } else {
                showToast(`ℹ️ No new qualifying buys found (checked ${qualifyingTransactions} transactions)`, 'info');
            }
            
            // Update last scan info
            document.getElementById('lastScanInfo').textContent = 
                `Last scan: ${formatDate(new Date())} - Found ${newEntries} new entries (DexScreener)`;
            
            // Reload draw data
            await loadDrawData();
        } else {
            showToast(`❌ Scan failed: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Error scanning:', error);
        showToast('❌ Failed to scan. Check console for details.', 'error');
    } finally {
        scanBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
});

// Refresh results
document.getElementById('refreshBtn').addEventListener('click', async () => {
    showToast('🔄 Refreshing results...', 'info');
    await loadDrawData();
    showToast('✅ Results refreshed', 'success');
});

// Timezone functionality removed - using local time display like admin page

// Export functionality
document.getElementById('exportBtn').addEventListener('click', () => {
    if (!currentEntries || currentEntries.length === 0) {
        showToast('❌ No entries to export', 'error');
        return;
    }
    
    exportToCSV();
});

// Manual Add Transaction event listeners
document.getElementById('manualAddBtn').addEventListener('click', openManualAddModal);
document.getElementById('closeManualAddModal').addEventListener('click', closeManualAddModal);
document.getElementById('cancelManualAdd').addEventListener('click', closeManualAddModal);
document.getElementById('submitManualAdd').addEventListener('click', submitManualAddTransaction);

// Close modal when clicking outside
document.getElementById('manualAddModal').addEventListener('click', (e) => {
    if (e.target.id === 'manualAddModal') {
        closeManualAddModal();
    }
});

function exportToCSV() {
    try {
        // Prepare CSV data
        const csvData = [
            ['Lotto Number', 'Wallet Address', 'USD Amount', 'Token Amount', 'Transaction Signature', 'Timestamp']
        ];
        
        // Add entries data
        currentEntries.forEach(entry => {
            csvData.push([
                entry.lotto_number,
                entry.wallet_address,
                entry.usd_amount,
                entry.token_amount,
                entry.transaction_signature,
                entry.timestamp
            ]);
        });
        
        // Convert to CSV string
        const csvString = csvData.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
        
        // Create and download file
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `lotto-draw-${drawId}-${currentDraw.draw_name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast(`✅ Exported ${currentEntries.length} entries to CSV`, 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showToast('❌ Export failed', 'error');
    }
}

// Listen for theme changes to re-render balls
window.addEventListener('themeChanged', () => {
    if (currentEntries && currentEntries.length > 0) {
        applyThemeToBalls();
        applyThemeToLottoBalls();
    }
});

// Auto-refresh every 30 seconds
setInterval(async () => {
    console.log('Auto-refreshing draw data...');
    await loadDrawData();
}, 30000);

// Draw Management Functions
async function markDrawAsComplete() {
    if (!confirm('Are you sure you want to mark this draw as complete? This will end the draw.')) {
        return;
    }

    try {
        if (!authManager.isAuthenticated()) {
            showToast('❌ You must be logged in', 'error');
            return;
        }

        const authHeaders = authManager.getAuthHeaders();
        const response = await fetch(`${API_URL}/api/draws/${drawId}/status`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({ status: 'completed' })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('✅ Draw marked as complete!', 'success');
            await loadDrawData();
        } else {
            showToast(`❌ Error: ${data.error || 'Failed to update status'}`, 'error');
        }
    } catch (error) {
        console.error('Error marking draw as complete:', error);
        showToast('❌ Failed to update draw status', 'error');
    }
}

async function deactivateDraw() {
    if (!confirm('Are you sure you want to deactivate this draw? It will be marked as cancelled.')) {
        return;
    }

    try {
        if (!authManager.isAuthenticated()) {
            showToast('❌ You must be logged in', 'error');
            return;
        }

        const authHeaders = authManager.getAuthHeaders();
        const response = await fetch(`${API_URL}/api/draws/${drawId}/status`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({ status: 'cancelled' })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('✅ Draw deactivated!', 'success');
            await loadDrawData();
        } else {
            showToast(`❌ Error: ${data.error || 'Failed to update status'}`, 'error');
        }
    } catch (error) {
        console.error('Error deactivating draw:', error);
        showToast('❌ Failed to deactivate draw', 'error');
    }
}

async function deleteDraw() {
    if (!confirm(`⚠️ Are you sure you want to DELETE this draw?\n\nThis will permanently delete:\n- The draw\n- All entries (lotto numbers)\n- All scan history\n\nThis action cannot be undone!`)) {
        return;
    }

    try {
        if (!authManager.isAuthenticated()) {
            showToast('❌ You must be logged in', 'error');
            return;
        }

        const authHeaders = authManager.getAuthHeaders();
        const response = await fetch(`${API_URL}/api/draws/${drawId}`, {
            method: 'DELETE',
            headers: authHeaders
        });

        const data = await response.json();

        if (response.ok) {
            showToast('✅ Draw deleted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showToast(`❌ Error: ${data.error || 'Failed to delete draw'}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting draw:', error);
        showToast('❌ Failed to delete draw', 'error');
    }
}

// Update draw info to show/hide management buttons based on status
function updateDrawManagementButtons() {
    if (!currentDraw) return;

    const markCompleteBtn = document.getElementById('markCompleteBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const deleteDrawBtn = document.getElementById('deleteDrawBtn');

    // Show buttons based on draw status
    if (currentDraw.status === 'active') {
        markCompleteBtn.style.display = 'inline-flex';
        deactivateBtn.style.display = 'inline-flex';
    } else {
        markCompleteBtn.style.display = 'none';
        deactivateBtn.style.display = 'none';
    }

    // Delete button always available (admin only)
    deleteDrawBtn.style.display = 'inline-flex';
}

// Setup event listeners for management buttons
function setupDrawManagementButtons() {
    const markCompleteBtn = document.getElementById('markCompleteBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const deleteDrawBtn = document.getElementById('deleteDrawBtn');

    if (markCompleteBtn && !markCompleteBtn.hasAttribute('data-listener')) {
        markCompleteBtn.addEventListener('click', markDrawAsComplete);
        markCompleteBtn.setAttribute('data-listener', 'true');
    }
    if (deactivateBtn && !deactivateBtn.hasAttribute('data-listener')) {
        deactivateBtn.addEventListener('click', deactivateDraw);
        deactivateBtn.setAttribute('data-listener', 'true');
    }
    if (deleteDrawBtn && !deleteDrawBtn.hasAttribute('data-listener')) {
        deleteDrawBtn.addEventListener('click', deleteDraw);
        deleteDrawBtn.setAttribute('data-listener', 'true');
    }
}

// Prize Edit Functions
function setupPrizeEdit() {
    const editPrizeBtn = document.getElementById('editPrizeBtn');
    const cancelPrizeEditBtn = document.getElementById('cancelPrizeEditBtn');
    const savePrizeBtn = document.getElementById('savePrizeBtn');
    const editPrizeForm = document.getElementById('editPrizeForm');
    const prizeDescriptionLong = document.getElementById('prizeDescriptionLong');
    
    if (!editPrizeBtn || !editPrizeForm) return;
    
    // Edit button click - show form
    if (editPrizeBtn && !editPrizeBtn.hasAttribute('data-listener')) {
        editPrizeBtn.addEventListener('click', () => {
            // Populate form with current values
            document.getElementById('editPrizeShort').value = currentDraw.prize_description_short || '';
            document.getElementById('editPrizeLong').value = currentDraw.prize_description_long || '';
            
            // Show form, hide display
            editPrizeForm.style.display = 'block';
            prizeDescriptionLong.style.display = 'none';
            editPrizeBtn.style.display = 'none';
        });
        editPrizeBtn.setAttribute('data-listener', 'true');
    }
    
    // Cancel button
    if (cancelPrizeEditBtn && !cancelPrizeEditBtn.hasAttribute('data-listener')) {
        cancelPrizeEditBtn.addEventListener('click', () => {
            editPrizeForm.style.display = 'none';
            prizeDescriptionLong.style.display = 'block';
            editPrizeBtn.style.display = 'inline-block';
        });
        cancelPrizeEditBtn.setAttribute('data-listener', 'true');
    }
    
    // Save button
    if (savePrizeBtn && !savePrizeBtn.hasAttribute('data-listener')) {
        savePrizeBtn.addEventListener('click', async () => {
            const prizeShort = document.getElementById('editPrizeShort').value.trim();
            const prizeLong = document.getElementById('editPrizeLong').value.trim();
            
            if (!prizeShort && !prizeLong) {
                showToast('❌ At least one prize description must be provided', 'error');
                return;
            }
            
            if (prizeShort && prizeShort.length > 150) {
                showToast('❌ Short description must be 150 characters or less', 'error');
                return;
            }
            
            // Disable button and show loading
            savePrizeBtn.disabled = true;
            savePrizeBtn.textContent = '💾 Saving...';
            
            try {
                if (!authManager.isAuthenticated()) {
                    showToast('❌ You must be logged in to edit prizes', 'error');
                    window.location.href = '/login.html';
                    return;
                }
                
                const authHeaders = authManager.getAuthHeaders();
                
                const response = await fetch(`${API_URL}/api/draws/${drawId}/prizes`, {
                    method: 'PUT',
                    headers: {
                        ...authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prize_description_short: prizeShort || null,
                        prize_description_long: prizeLong || null
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showToast('✅ Prize descriptions updated successfully!', 'success');
                    
                    // Update current draw data
                    currentDraw.prize_description_short = prizeShort || null;
                    currentDraw.prize_description_long = prizeLong || null;
                    
                    // Update display
                    if (currentDraw.prize_description_long) {
                        prizeDescriptionLong.textContent = currentDraw.prize_description_long;
                    } else if (currentDraw.prize_description_short) {
                        prizeDescriptionLong.textContent = currentDraw.prize_description_short;
                    } else {
                        prizeDescriptionLong.textContent = '';
                    }
                    
                    // Hide form, show display
                    editPrizeForm.style.display = 'none';
                    prizeDescriptionLong.style.display = 'block';
                    editPrizeBtn.style.display = 'inline-block';
                } else {
                    showToast(`❌ Error: ${data.error || 'Failed to update prizes'}`, 'error');
                }
            } catch (error) {
                console.error('Error updating prizes:', error);
                showToast('❌ Failed to update prizes. Check console for details.', 'error');
            } finally {
                savePrizeBtn.disabled = false;
                savePrizeBtn.textContent = '💾 Save Changes';
            }
        });
        savePrizeBtn.setAttribute('data-listener', 'true');
    }
}

// Initial load
loadDrawData();

