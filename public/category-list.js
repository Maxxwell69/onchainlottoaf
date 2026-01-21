// Category List Page
const API_URL = window.location.origin;

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/api/tokens/categories`);
        const data = await response.json();

        if (data.success && data.categories && data.categories.length > 0) {
            renderCategories(data.categories);
        } else {
            document.getElementById('categoriesContainer').innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <h3>No Categories Available</h3>
                    <p>There are currently no categories with active draws</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        document.getElementById('categoriesContainer').innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>Error Loading Categories</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

// Render categories
function renderCategories(categories) {
    const container = document.getElementById('categoriesContainer');
    
    container.innerHTML = categories.map(category => `
        <div class="category-card" style="
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        " onclick="window.location.href='category-draws.html?category=${encodeURIComponent(category)}'">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🪙</div>
            <h3 style="margin: 0; color: var(--primary);">${category}</h3>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">View Draws →</p>
        </div>
    `).join('');
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});
