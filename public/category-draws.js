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
    if (!category) {
        document.getElementById('categoryName').textContent = 'Category Not Found';
        document.getElementById('categoryDrawsContainer').innerHTML = `
            <div class="empty-state">
                <h3>Category not specified</h3>
                <p>Please select a category from the <a href="category-list.html">category list</a></p>
            </div>
        `;
        return;
    }

    document.getElementById('categoryName').textContent = category;
    
    try {
        const response = await fetch(`${API_URL}/api/draws/public/category/${encodeURIComponent(category)}`);
        const data = await response.json();

        if (data.success && data.draws && data.draws.length > 0) {
            renderCategoryDraws(data.draws);
        } else {
            document.getElementById('categoryDrawsContainer').innerHTML = `
                <div class="empty-state">
                    <h3>No Active Draws</h3>
                    <p>There are currently no active public draws for ${category}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading category draws:', error);
        document.getElementById('categoryDrawsContainer').innerHTML = `
            <div class="empty-state">
                <h3>Error Loading Draws</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

// Render category draws
function renderCategoryDraws(draws) {
    const container = document.getElementById('categoryDrawsContainer');
    
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
