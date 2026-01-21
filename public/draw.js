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

// Format start_time - it's stored as timezone-naive in the draw's timezone (not UTC)
// The stored time is already in EST/EDT, so we just display it as-is
function formatDateInTimezone(dateString, drawTimezone) {
    if (!dateString) return 'N/A';
    
    try {
        // Parse the date string (timezone-naive, already in the draw's timezone)
        let datePart, timePart;
        if (dateString.includes('T')) {
            const isoDate = dateString.split('T')[0];
            const isoTime = dateString.split('T')[1].split('.')[0].replace('Z', '');
            datePart = isoDate;
            timePart = isoTime;
        } else {
            [datePart, timePart] = dateString.split(' ');
        }
        
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        // The stored time is already in the draw's timezone (EST/EDT)
        // We just need to format it for display
        // Create a date object - JavaScript will interpret this as local time
        // but we'll format it directly from the components
        const hour12 = parseInt(hour) % 12 || 12;
        const ampm = parseInt(hour) >= 12 ? 'PM' : 'AM';
        const monthStr = String(parseInt(month)).padStart(2, '0');
        const dayStr = String(parseInt(day)).padStart(2, '0');
        const minuteStr = String(parseInt(minute)).padStart(2, '0');
        
        return `${monthStr}/${dayStr}/${year}, ${hour12}:${minuteStr} ${ampm}`;
    } catch (error) {
        console.error('Error formatting date:', error, 'Input:', dateString);
        return 'Invalid Date';
    }
}

// Format functions - convert UTC timestamps to draw's timezone for display
function formatDate(dateString, drawTimezone = null) {
    if (!dateString) return 'N/A';
    
    try {
        // Handle both formats: "YYYY-MM-DD HH:MM:SS" and "YYYY-MM-DDTHH:MM:SS.sssZ"
        let datePart, timePart;
        let isUTC = false;
        
        if (dateString.includes('T')) {
            // ISO format: "2025-10-17T23:30:00.000Z"
            if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
                isUTC = true;
            }
            const isoDate = dateString.split('T')[0];
            const isoTime = dateString.split('T')[1].split('.')[0].replace('Z', ''); // Remove milliseconds and Z
            datePart = isoDate;
            timePart = isoTime;
        } else {
            // Space format: "YYYY-MM-DD HH:MM:SS" - assume UTC if no timezone info
            [datePart, timePart] = dateString.split(' ');
            // If we have a draw timezone, assume stored timestamps are in UTC
            if (drawTimezone) {
                isUTC = true;
            }
        }
        
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        let date;
        if (isUTC && drawTimezone) {
            // Create date as UTC, then format in the draw's timezone
            const utcDate = new Date(Date.UTC(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second || 0)
            ));
            
            // TEMPORARY FIX: Subtract 1 hour for EST until daylight savings time
            // This ensures times display correctly in EST (UTC-5) instead of EDT (UTC-4)
            let displayDate = utcDate;
            if (drawTimezone === 'America/New_York') {
                // Subtract 1 hour to convert from EDT to EST
                displayDate = new Date(utcDate.getTime() - (60 * 60 * 1000));
            }
            
            // Format in the draw's timezone
            return displayDate.toLocaleString('en-US', {
                timeZone: drawTimezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } else {
            // Fallback: treat as local time (for backwards compatibility)
            date = new Date(year, month - 1, day, hour, minute, second || 0);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
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

// Get timezone abbreviation for a specific date/time
function getTimezoneAbbreviation(timezone, dateString) {
    if (!timezone) return 'UTC';
    
    try {
        if (dateString) {
            // Parse the date string (timezone-naive)
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
            
            // Create a date object from the components (local time)
            const dateObj = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second || 0)
            );
            
            // Format the date in the target timezone to get the correct abbreviation
            // This will automatically show EST or EDT based on whether DST is in effect
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                timeZoneName: 'short'
            });
            
            const parts = formatter.formatToParts(dateObj);
            const timeZoneName = parts.find(part => part.type === 'timeZoneName');
            
            if (timeZoneName) {
                return timeZoneName.value;
            }
            
            // Fallback for America/New_York - determine EST vs EDT
            if (timezone === 'America/New_York') {
                // DST in US typically: 2nd Sunday in March to 1st Sunday in November
                // For simplicity, use month-based approximation
                const monthNum = parseInt(month);
                // Rough approximation: March (3) through October (10) is typically EDT
                if (monthNum >= 3 && monthNum <= 10) {
                    return 'EDT';
                } else {
                    return 'EST';
                }
            }
            
            return timezone.split('/').pop() || 'UTC';
        } else {
            // Fallback to current date
            const date = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                timeZoneName: 'short'
            });
            
            const parts = formatter.formatToParts(date);
            const timeZoneName = parts.find(part => part.type === 'timeZoneName');
            
            return timeZoneName ? timeZoneName.value : timezone.split('/').pop() || 'UTC';
        }
    } catch (error) {
        // If timezone is invalid, return fallback
        if (timezone === 'America/New_York') return 'EST/EDT';
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
            if (response.status === 404) {
                // Draw not found - show user-friendly message and redirect
                showToast('❌ Draw not found. It may have been deleted.', 'error');
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
                return;
            }
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
        
        // If it's a network error or draw not found, redirect after a delay
        if (error.message.includes('not found') || error.message.includes('404')) {
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
        }
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
    // Note: start_time is stored as timezone-naive in the draw's timezone, not UTC
    const timezone = currentDraw.timezone || 'UTC';
    const startTimeDisplay = formatDateInTimezone(currentDraw.start_time, timezone);
    const timezoneAbbr = getTimezoneAbbreviation(timezone, currentDraw.start_time);
    document.getElementById('startTime').textContent = `${startTimeDisplay} (${timezoneAbbr})`;
    
    // Display minimum scan amount (admin only - not shown on public page)
    const minScanAmountEl = document.getElementById('minScanAmount');
    if (minScanAmountEl && currentDraw.min_usd_amount) {
        minScanAmountEl.textContent = formatUSD(currentDraw.min_usd_amount);
    } else if (minScanAmountEl) {
        minScanAmountEl.textContent = 'N/A';
    }
    
    // Update public toggle checkbox
    const publicToggle = document.getElementById('publicToggle');
    if (publicToggle) {
        publicToggle.checked = currentDraw.is_public || false;
    }
    
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
        const walletDigits = entry.wallet_address.slice(-6);
        const isWinner = entry.is_winner || false;
        const winnerClass = isWinner ? 'winner-ball' : '';
        const clickHandler = `onclick="selectWinner(${entry.id}, ${entry.lotto_number}, '${entry.wallet_address.replace(/'/g, "\\'")}', ${entry.prize ? `'${entry.prize.replace(/'/g, "\\'")}'` : 'null'})"`;
        
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
        
        const title = isWinner 
            ? `Draw Result - Prize: ${entry.prize || 'N/A'}`
            : `Purchased ${timeFromStart} - $${entry.usd_amount}`;
        
        // Only show gold ball if there's an actual owner (not manual winner)
        const ballClass = (entry.wallet_address === 'Manual Winner') ? 'available' : 'filled';
        
        html += `
            <div class="number-ball-container">
                <div class="number-ball ${ballClass} ${winnerClass}" 
                     title="${title}"
                     style="cursor: pointer;"
                     ${clickHandler}>
                    ${entry.lotto_number}
                </div>
                <div class="wallet-digits">${isWinner ? '🏆' : ''} ${entry.wallet_address === 'Manual Winner' ? 'Vacant' : walletDigits}</div>
            </div>
        `;
    });
    
    // Then, render available balls (not yet purchased) in lotto number order
    const filledNumbers = currentEntries.map(entry => entry.lotto_number);
    for (let i = 1; i <= currentDraw.total_slots; i++) {
        if (!filledNumbers.includes(i)) {
            // Check if this number is already a winner (might have winner without entry)
            const winnerEntry = currentEntries.find(e => e.lotto_number === i && e.is_winner);
            const isWinner = winnerEntry ? true : false;
            
            // Only show as winner-ball if there's an actual entry with owner
            // Empty balls should remain as "available" (vacant) even if they have a prize
            const winnerClass = (isWinner && winnerEntry && winnerEntry.wallet_address !== 'Manual Winner') ? 'winner-ball' : '';
            const clickHandler = isWinner 
                ? `onclick="selectWinner(${winnerEntry.id}, ${i}, '${winnerEntry.wallet_address.replace(/'/g, "\\'")}', '${(winnerEntry.prize || '').replace(/'/g, "\\'")}')"`
                : `onclick="selectWinnerForEmptyBall(${i})"`;
            const title = isWinner ? 'Click to edit draw result' : 'Click to assign draw result (vacant ball)';
            
            html += `
                <div class="number-ball-container">
                    <div class="number-ball available ${winnerClass}" title="${title}" style="cursor: pointer;" ${clickHandler}>
                        ${i}
                    </div>
                    ${isWinner ? '<div class="wallet-digits" style="color: var(--primary); font-weight: bold;">🏆 Draw Result</div>' : '<div class="wallet-digits" style="color: var(--text-secondary); font-style: italic;">Vacant</div>'}
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
    
    entriesList.innerHTML = sortedEntries.map(entry => {
        const isWinner = entry.is_winner || false;
        const winnerClass = isWinner ? 'winner-ball' : '';
        const winnerBadge = isWinner ? '<span class="winner-badge">🏆 Draw Result</span>' : '';
        const prizeDisplay = entry.prize ? `<div class="prize-display">🎁 ${entry.prize}</div>` : '';
        
        // Only show gold ball if there's an actual owner (not manual winner/vacant)
        const ballClass = (entry.wallet_address === 'Manual Winner') ? 'available' : 'filled';
        const displayClass = (entry.wallet_address === 'Manual Winner') ? 'available' : winnerClass;
        
        return `
        <div class="lotto-entry ${isWinner ? 'winner-entry' : ''}" data-entry-id="${entry.id}">
            <div class="lotto-ball ${ballClass} ${displayClass}" onclick="selectWinner(${entry.id}, ${entry.lotto_number}, '${entry.wallet_address.replace(/'/g, "\\'")}', ${isWinner ? `'${(entry.prize || '').replace(/'/g, "\\'")}'` : 'null'})" style="cursor: pointer;" title="${isWinner ? 'Click to edit draw result' : 'Click to select as draw result'}">
                ${entry.lotto_number}
            </div>
            <div class="entry-details">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <div class="entry-amount">
                        ${formatUSD(entry.usd_amount)}
                    </div>
                    ${winnerBadge}
                </div>
                ${prizeDisplay}
                <div class="entry-wallet">
                    <span class="wallet-address">${entry.wallet_address === 'Manual Winner' ? 'Vacant Ball (No Owner)' : entry.wallet_address}</span>
                    ${entry.wallet_address !== 'Manual Winner' ? `<button class="copy-btn" onclick="copyToClipboard('${entry.wallet_address}', this)">
                        📋 Copy
                    </button>` : ''}
                </div>
                <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <span class="entry-time">⏰ ${formatDate(entry.timestamp, currentDraw?.timezone || null)}</span>
                    <a href="https://solscan.io/tx/${entry.transaction_signature}" 
                       target="_blank" 
                       class="entry-tx-link">
                        🔍 View Transaction
                    </a>
                    ${isWinner ? `<button class="btn btn-small btn-secondary" onclick="shareWinnerOnTwitter(${entry.id}, ${entry.lotto_number}, '${entry.wallet_address.replace(/'/g, "\\'")}', '${(entry.prize || '').replace(/'/g, "\\'")}')" style="margin-left: auto;">🐦 Share</button>` : ''}
                </div>
            </div>
        </div>
    `;
    }).join('');
    
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

async function markDrawAsDrawn() {
    if (!confirm('Are you sure you want to mark this draw as drawn? It will be removed from the public homepage.')) {
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
            body: JSON.stringify({ status: 'drawn' })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('✅ Draw marked as drawn! It will no longer appear on the public page.', 'success');
            await loadDrawData();
        } else {
            showToast(`❌ Error: ${data.error || 'Failed to update status'}`, 'error');
        }
    } catch (error) {
        console.error('Error marking draw as drawn:', error);
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
    const markDrawnBtn = document.getElementById('markDrawnBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const deleteDrawBtn = document.getElementById('deleteDrawBtn');

    // Show buttons based on draw status
    if (currentDraw.status === 'active') {
        markCompleteBtn.style.display = 'inline-flex';
        markDrawnBtn.style.display = 'inline-flex';
        deactivateBtn.style.display = 'inline-flex';
    } else if (currentDraw.status === 'completed') {
        // Show "Mark as Drawn" for completed draws
        markDrawnBtn.style.display = 'inline-flex';
        markCompleteBtn.style.display = 'none';
        deactivateBtn.style.display = 'inline-flex';
    } else {
        markCompleteBtn.style.display = 'none';
        markDrawnBtn.style.display = 'none';
        deactivateBtn.style.display = 'none';
    }

    // Delete button always available (admin only)
    deleteDrawBtn.style.display = 'inline-flex';
}

// Toggle public visibility
async function togglePublicVisibility() {
    const publicToggle = document.getElementById('publicToggle');
    if (!publicToggle || !currentDraw) return;
    
    const isPublic = publicToggle.checked;
    
    try {
        if (!authManager.isAuthenticated()) {
            showToast('❌ You must be logged in', 'error');
            publicToggle.checked = !isPublic; // Revert checkbox
            return;
        }

        const authHeaders = authManager.getAuthHeaders();
        const response = await fetch(`${API_URL}/api/draws/${drawId}/public`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({ is_public: isPublic })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(`✅ Draw ${isPublic ? 'made public' : 'made private'}!`, 'success');
            currentDraw.is_public = isPublic; // Update local state
        } else {
            showToast(`❌ Error: ${data.error || 'Failed to update visibility'}`, 'error');
            publicToggle.checked = !isPublic; // Revert checkbox
        }
    } catch (error) {
        console.error('Error updating public visibility:', error);
        showToast('❌ Failed to update visibility', 'error');
        publicToggle.checked = !isPublic; // Revert checkbox
    }
}

// Setup event listeners for management buttons
function setupDrawManagementButtons() {
    // Setup public toggle
    const publicToggle = document.getElementById('publicToggle');
    if (publicToggle && !publicToggle.hasAttribute('data-listener')) {
        publicToggle.addEventListener('change', togglePublicVisibility);
        publicToggle.setAttribute('data-listener', 'true');
    }
    
    const markCompleteBtn = document.getElementById('markCompleteBtn');
    const markDrawnBtn = document.getElementById('markDrawnBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const deleteDrawBtn = document.getElementById('deleteDrawBtn');

    if (markCompleteBtn && !markCompleteBtn.hasAttribute('data-listener')) {
        markCompleteBtn.addEventListener('click', markDrawAsComplete);
        markCompleteBtn.setAttribute('data-listener', 'true');
    }
    if (markDrawnBtn && !markDrawnBtn.hasAttribute('data-listener')) {
        markDrawnBtn.addEventListener('click', markDrawAsDrawn);
        markDrawnBtn.setAttribute('data-listener', 'true');
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

// Winner Selection Functions
let selectedEntryId = null;
let selectedEntryData = null;
let isEmptyBallWinner = false;

function selectWinner(entryId, lottoNumber, walletAddress, currentPrize = null) {
    selectedEntryId = entryId;
    selectedEntryData = {
        lottoNumber,
        walletAddress,
        currentPrize
    };
    isEmptyBallWinner = false;
    
    // Get current date for draw results (just date, not time)
    let drawDate = new Date().toLocaleDateString();
    if (currentDraw && currentDraw.start_time) {
        try {
            const datePart = currentDraw.start_time.split('T')[0] || currentDraw.start_time.split(' ')[0];
            const [year, month, day] = datePart.split('-');
            drawDate = `${month}/${day}/${year}`;
        } catch (e) {
            drawDate = new Date().toLocaleDateString();
        }
    }
    
    // Populate modal
    document.getElementById('winnerBallNum').textContent = lottoNumber;
    document.getElementById('winnerWallet').textContent = walletAddress;
    document.getElementById('winnerPrize').value = currentPrize || '';
    
    // Update modal title with date
    const modalHeader = document.querySelector('#winnerModal .modal-header h3');
    if (modalHeader) {
        modalHeader.textContent = `🏆 Draw Results - ${drawDate}`;
    }
    
    // Show wallet field
    const winnerWalletContainer = document.getElementById('winnerWallet').parentElement;
    if (winnerWalletContainer) winnerWalletContainer.style.display = 'block';
    
    // Update ball display in modal - show as gold ball since it has owner
    const winnerBallNumber = document.getElementById('winnerBallNumber');
    winnerBallNumber.textContent = lottoNumber;
    winnerBallNumber.className = 'lotto-ball filled winner-ball';
    
    // Apply theme if available
    setTimeout(() => {
        if (window.themeManager) {
            window.themeManager.applyThemeToElement(winnerBallNumber);
        }
    }, 50);
    
    // Show modal
    document.getElementById('winnerModal').style.display = 'flex';
}

function selectWinnerForEmptyBall(lottoNumber) {
    selectedEntryId = null;
    selectedEntryData = {
        lottoNumber,
        walletAddress: null,
        currentPrize: null
    };
    isEmptyBallWinner = true;
    
    // Get current date for draw results (just date, not time)
    let drawDate = new Date().toLocaleDateString();
    if (currentDraw && currentDraw.start_time) {
        try {
            const datePart = currentDraw.start_time.split('T')[0] || currentDraw.start_time.split(' ')[0];
            const [year, month, day] = datePart.split('-');
            drawDate = `${month}/${day}/${year}`;
        } catch (e) {
            drawDate = new Date().toLocaleDateString();
        }
    }
    
    // Populate modal
    document.getElementById('winnerBallNum').textContent = lottoNumber;
    document.getElementById('winnerWallet').textContent = 'Vacant Ball (No Owner)';
    document.getElementById('winnerPrize').value = '';
    
    // Update modal title with date
    const modalHeader = document.querySelector('#winnerModal .modal-header h3');
    if (modalHeader) {
        modalHeader.textContent = `🏆 Draw Results - ${drawDate}`;
    }
    
    // Hide wallet field or show placeholder
    const winnerWalletContainer = document.getElementById('winnerWallet').parentElement;
    if (winnerWalletContainer) {
        winnerWalletContainer.style.display = 'block';
        document.getElementById('winnerWallet').style.color = 'var(--text-secondary)';
        document.getElementById('winnerWallet').style.fontStyle = 'italic';
    }
    
    // Update ball display in modal - show as vacant (available) ball, not gold
    const winnerBallNumber = document.getElementById('winnerBallNumber');
    winnerBallNumber.textContent = lottoNumber;
    winnerBallNumber.className = 'lotto-ball available';
    
    // Show modal
    document.getElementById('winnerModal').style.display = 'flex';
}

function closeWinnerModal() {
    document.getElementById('winnerModal').style.display = 'none';
    selectedEntryId = null;
    selectedEntryData = null;
    isEmptyBallWinner = false;
    document.getElementById('winnerPrize').value = '';
    
    // Reset wallet display
    const winnerWallet = document.getElementById('winnerWallet');
    if (winnerWallet) {
        winnerWallet.style.color = '';
        winnerWallet.style.fontStyle = '';
    }
}

async function saveWinner() {
    if (!selectedEntryData) return;
    
    const prizeInput = document.getElementById('winnerPrize');
    const prize = prizeInput.value.trim();
    
    if (!prize) {
        showToast('❌ Please enter a prize description', 'error');
        return;
    }
    
    const saveBtn = document.getElementById('saveWinnerBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '💾 Saving...';
    
    try {
        const authHeaders = authManager.getAuthHeaders();
        if (!authHeaders) {
            window.location.href = '/login.html';
            return;
        }
        
        let response;
        let data;
        
        if (isEmptyBallWinner && !selectedEntryId) {
            // Assign winner to empty ball - create entry first
            response = await fetch(`/api/draws/${drawId}/entries/empty-ball-winner`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    lotto_number: selectedEntryData.lottoNumber,
                    prize: prize,
                    is_winner: true
                })
            });
        } else {
            // Update existing entry
            response = await fetch(`/api/draws/${drawId}/entries/${selectedEntryId}/winner`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({
                    prize: prize,
                    is_winner: true
                })
            });
        }
        
        data = await response.json();
        
        if (response.ok) {
            showToast('✅ Winner assigned successfully!', 'success');
            closeWinnerModal();
            
            // Reload draw data to refresh display
            await loadDrawData();
        } else {
            showToast(`❌ Error: ${data.error || 'Failed to assign winner'}`, 'error');
        }
    } catch (error) {
        console.error('Error assigning winner:', error);
        showToast('❌ Failed to assign winner. Check console for details.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Assign Prize';
    }
}

// Twitter Share Functions
function shareWinnerOnTwitter(entryId, lottoNumber, walletAddress, prize) {
    // Get last 6 digits of wallet
    const walletDigits = walletAddress.slice(-6);
    
    // Populate share modal
    document.getElementById('shareBallNum').textContent = lottoNumber;
    document.getElementById('shareWalletDigits').textContent = walletDigits;
    document.getElementById('sharePrize').textContent = prize;
    
    // Update ball display
    const shareBallNumber = document.getElementById('shareBallNumber');
    shareBallNumber.textContent = lottoNumber;
    shareBallNumber.className = 'lotto-ball winner-ball';
    
    // Apply theme
    setTimeout(() => {
        if (window.themeManager) {
            window.themeManager.applyThemeToElement(shareBallNumber);
        }
    }, 50);
    
    // Generate Twitter text with date
    const drawName = currentDraw?.draw_name || 'Lotto Draw';
    let drawDate = new Date().toLocaleDateString();
    if (currentDraw && currentDraw.start_time) {
        try {
            const datePart = currentDraw.start_time.split('T')[0] || currentDraw.start_time.split(' ')[0];
            const [year, month, day] = datePart.split('-');
            drawDate = `${month}/${day}/${year}`;
        } catch (e) {
            drawDate = new Date().toLocaleDateString();
        }
    }
    const twitterText = `🎉 Draw Results! 🎉

Ball #${lottoNumber} - ${drawDate}

Wallet: ...${walletDigits}
Prize: ${prize}

${drawName}

#OnChainLotto #Solana #Crypto`;
    
    document.getElementById('twitterShareText').value = twitterText;
    
    // Create Twitter share URL
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
    document.getElementById('openTwitterLink').href = twitterUrl;
    
    // Show modal
    document.getElementById('twitterShareModal').style.display = 'flex';
}

function closeTwitterModal() {
    document.getElementById('twitterShareModal').style.display = 'none';
}

async function copyTwitterText() {
    const twitterText = document.getElementById('twitterShareText').value;
    
    try {
        await navigator.clipboard.writeText(twitterText);
        showToast('✅ Twitter text copied to clipboard!', 'success');
    } catch (error) {
        console.error('Error copying text:', error);
        showToast('❌ Failed to copy text', 'error');
    }
}

// Initialize winner modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Winner modal
    const winnerModal = document.getElementById('winnerModal');
    const closeWinnerModalBtn = document.getElementById('closeWinnerModal');
    const cancelWinnerBtn = document.getElementById('cancelWinnerBtn');
    const saveWinnerBtn = document.getElementById('saveWinnerBtn');
    
    if (closeWinnerModalBtn) {
        closeWinnerModalBtn.addEventListener('click', closeWinnerModal);
    }
    if (cancelWinnerBtn) {
        cancelWinnerBtn.addEventListener('click', closeWinnerModal);
    }
    if (saveWinnerBtn) {
        saveWinnerBtn.addEventListener('click', saveWinner);
    }
    if (winnerModal) {
        winnerModal.addEventListener('click', (e) => {
            if (e.target === winnerModal) {
                closeWinnerModal();
            }
        });
    }
    
    // Twitter share modal
    const twitterModal = document.getElementById('twitterShareModal');
    const closeTwitterModalBtn = document.getElementById('closeTwitterModal');
    const cancelTwitterBtn = document.getElementById('cancelTwitterBtn');
    const copyTwitterBtn = document.getElementById('copyTwitterBtn');
    
    if (closeTwitterModalBtn) {
        closeTwitterModalBtn.addEventListener('click', closeTwitterModal);
    }
    if (cancelTwitterBtn) {
        cancelTwitterBtn.addEventListener('click', closeTwitterModal);
    }
    if (copyTwitterBtn) {
        copyTwitterBtn.addEventListener('click', copyTwitterText);
    }
    if (twitterModal) {
        twitterModal.addEventListener('click', (e) => {
            if (e.target === twitterModal) {
                closeTwitterModal();
            }
        });
    }
});

// Initial load
loadDrawData();

