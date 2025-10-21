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

// Format functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
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

// Render numbers grid (1-69)
function renderNumbersGrid() {
    const grid = document.getElementById('numbersGrid');
    const filledNumbers = currentEntries.map(entry => entry.lotto_number);
    
    let html = '';
    for (let i = 1; i <= 69; i++) {
        const isFilled = filledNumbers.includes(i);
        html += `
            <div class="number-box ${isFilled ? 'filled' : 'available'}" 
                 title="${isFilled ? 'Assigned' : 'Available'}">
                ${i}
            </div>
        `;
    }
    
    grid.innerHTML = html;
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
    
    // Sort by lotto number
    const sortedEntries = [...currentEntries].sort((a, b) => a.lotto_number - b.lotto_number);
    
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

// Scan for new buys
document.getElementById('scanBtn').addEventListener('click', async () => {
    const scanBtn = document.getElementById('scanBtn');
    const btnText = document.getElementById('scanBtnText');
    const btnSpinner = document.getElementById('scanBtnSpinner');
    
    scanBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    
    showToast('🔍 Scanning blockchain for new qualifying buys...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/api/draws/${drawId}/scan`, {
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
                `Last scan: ${formatDate(new Date())} - Found ${newEntries} new entries`;
            
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

// Auto-refresh every 30 seconds
setInterval(async () => {
    console.log('Auto-refreshing draw data...');
    await loadDrawData();
}, 30000);

// Initial load
loadDrawData();

