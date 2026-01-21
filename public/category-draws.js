// Category Draws Page
const API_URL = window.location.origin;

// Get category from URL parameter
function getCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('category');
}

// Load category draws
async function loadCategoryDraws() {
    const category = getCategoryFromURL();
    const container = document.getElementById('categoryDrawsContainer');
    const categoryNameEl = document.getElementById('categoryName');
    
    if (!category) {
        if (categoryNameEl) categoryNameEl.textContent = 'Category Not Found';
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Category not specified</h3>
                    <p>Please select a category from the <a href="category-list.html">category list</a></p>
                </div>
            `;
        }
        return;
    }

    // Decode URL-encoded category name and replace underscores with spaces for display
    const displayCategory = decodeURIComponent(category).replace(/_/g, ' ');
    if (categoryNameEl) categoryNameEl.textContent = displayCategory;
    
    try {
        const apiUrl = `${API_URL}/api/draws/public/category/${encodeURIComponent(category)}`;
        console.log('Fetching category draws from:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Category draws response:', data);

        if (data.success && data.draws && data.draws.length > 0) {
            renderCategoryDraws(data.draws);
        } else {
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No Active Draws</h3>
                        <p>There are currently no active public draws for ${displayCategory}</p>
                        <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                            Make sure draws are marked as public in the admin panel.
                        </p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading category draws:', error);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Error Loading Draws</h3>
                    <p>Failed to load draws for category: ${displayCategory}</p>
                    <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                        Error: ${error.message}
                    </p>
                    <p style="margin-top: 0.5rem;">
                        <a href="category-list.html" style="color: var(--primary);">← Back to Categories</a>
                    </p>
                </div>
            `;
        }
    }
}

// Render category draws
function renderCategoryDraws(draws) {
    const container = document.getElementById('categoryDrawsContainer');
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    console.log(`Rendering ${draws.length} draws`);
    
    container.innerHTML = draws.map(draw => `
        <div class="draw-card" style="
            min-width: 350px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        " onclick="window.location.href='public-draw.html?id=${draw.id}'">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: var(--primary);">${draw.draw_name}</h3>
                <span class="status-badge status-${draw.status}">${draw.status}</span>
            </div>
            <div style="margin-bottom: 1rem;">
                <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                    <strong>Token:</strong> ${draw.token_symbol || 'Unknown'}
                </p>
                <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                    <strong>Min Purchase:</strong> $${parseFloat(draw.min_usd_amount).toFixed(2)}
                </p>
                <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                    <strong>Progress:</strong> ${draw.filled_slots} / ${draw.total_slots} slots
                </p>
            </div>
            ${draw.prize_description_short ? `
                <div style="padding: 1rem; background: var(--background); border-radius: 8px; margin-top: 1rem;">
                    <p style="margin: 0; color: var(--text);">${draw.prize_description_short}</p>
                </div>
            ` : ''}
            <div style="margin-top: 1rem; text-align: center;">
                <button class="btn btn-primary" style="width: 100%;">View Draw →</button>
            </div>
        </div>
    `).join('');
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadCategoryDraws();
});
