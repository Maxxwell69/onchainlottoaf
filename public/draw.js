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
    
    // Parse the timestamp correctly - it's stored as "YYYY-MM-DD HH:MM:SS"
    // We need to create a Date object that represents this exact time without conversion
    const [datePart, timePart] = dateString.split(' ');
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
        renderEntriesTable();
        
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
    
    document.getElementById('startTime').textContent = formatDate(currentDraw.start_time);
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
        
        if (usdAmount < currentDraw.min_usd_amount) {
            showToast(`USD amount must be at least $${currentDraw.min_usd_amount}`, 'error');
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
        
        // Submit to API
        const response = await fetch('/api/manual-entries/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
        const response = await fetch(`${API_URL}/api/draws/${drawId}/scan-dex`, {
            method: 'POST'
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

// Auto-refresh every 30 seconds
setInterval(async () => {
    console.log('Auto-refreshing draw data...');
    await loadDrawData();
}, 30000);

// Initial load
loadDrawData();

