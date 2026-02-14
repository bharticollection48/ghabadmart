// --- 1. CONFIGURATION ---
// Is URL ko tabhi badlein jab aap naya Deployment karein
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwa6pRaolfAsAWvljQM_2wj1K6ZHm5pNnqMCKFGbZbCJ4o66HObBQh4DF0NKHZY9PKm/exec"; 

let allProducts = [];
let currentData = [];

/**
 * Page load hote hi data mangwane ki koshish karein
 */
window.onload = async () => {
    // Pehle LocalStorage wala turant dikhao (user ko khali screen na dikhe)
    const localData = localStorage.getItem('myProducts');
    if (localData) {
        allProducts = JSON.parse(localData);
        currentData = [...allProducts];
        render(allProducts);
    }
    // Phir Background mein Cloud se naya data lao
    await refreshData();
};

/**
 * Google Sheets se Fresh Data Lane Ke Liye
 */
async function refreshData() {
    try {
        // Cache busting ke liye timestamp (taki purana data na dikhe)
        const fetchUrl = SCRIPT_URL + (SCRIPT_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
        
        const response = await fetch(fetchUrl);
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        const sheetData = await response.json();
        
        if (sheetData && sheetData.length > 0) {
            allProducts = sheetData;
            currentData = [...allProducts];
            // Naye phone ke liye save karein
            localStorage.setItem('myProducts', JSON.stringify(allProducts));
            render(allProducts); 
            console.log("Cloud Data Synced!");
        }
    } catch (error) {
        console.error("Sheet load error:", error);
    }
    updateCartBadge();
}

/**
 * Render Function (Design & UI)
 */
function render(data) {
    const grid = document.getElementById('productDisplay');
    if (!grid) return;

    if (!data || data.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #888;">
                <i class="fa-solid fa-box-open" style="font-size: 40px; margin-bottom: 10px; color: #ccc;"></i>
                <h3>Abhi koi product live nahi hai</h3>
                <p>Admin panel se sync hone ka intezar karein.</p>
            </div>`;
        return;
    }

    grid.innerHTML = '';
    
    // Naye products ko upar dikhane ke liye reverse
    const displayData = [...data].reverse();

    displayData.forEach(p => {
        const currentPrice = parseFloat(p.price) || 0;
        const originalPrice = Math.round(currentPrice * 1.4);
        
        // Image logic: sheet ke header se matching
        let imgPath = p.mainImg || p.img || (p.gallery && p.gallery[0]) || 'https://via.placeholder.com/300?text=No+Image';

        grid.innerHTML += `
            <div class="product-card" onclick="openProduct(${p.id})">
                <div class="img-wrapper">
                    <img src="${imgPath}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300?text=Image+Error'">
                    <div class="wishlist-icon" onclick="event.stopPropagation(); addToWishlist(${p.id})">
                        <i class="fa-regular fa-heart"></i>
                    </div>
                </div>
                <div class="product-info">
                    <p class="product-name">${p.name}</p>
                    <div class="price-container">
                        <span class="main-price">₹${currentPrice}</span>
                        <span class="old-price">₹${originalPrice}</span>
                        <span class="discount-badge">30% OFF</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px;">
                         <span class="rating-pill">4.2 <i class="fa-solid fa-star" style="font-size: 8px;"></i></span>
                        <span style="font-size: 11px; color: #888;">Free Delivery</span>
                    </div>
                </div>
            </div>`;
    });
}

// --- Filtering & UI Logic ---

function searchProduct() {
    const val = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(val) || 
        (p.category && p.category.toLowerCase().includes(val))
    );
    render(filtered);
}

function filterProducts(categoryName) {
    currentData = (categoryName === 'All') 
        ? [...allProducts] 
        : allProducts.filter(p => p.category === categoryName);
    render(currentData);
}

function sortProducts(type) {
    const sorted = [...currentData].sort((a, b) => 
        type === 'low' ? a.price - b.price : b.price - a.price
    );
    render(sorted);
}

function openProduct(id) {
    window.location.href = `details.html?id=${id}`; 
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadgeIndex');
    if (!badge) return;
    let cart = JSON.parse(localStorage.getItem('myCart')) || [];
    badge.innerText = cart.length;
    badge.style.display = cart.length > 0 ? "block" : "none";
}

function addToWishlist(id) {
    alert("Wishlist mein add ho gaya! ❤️");
}

// Phone switch hone par refresh ke liye
window.onfocus = refreshData;