// --- 1. CONFIGURATION ---
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwa6pRaolfAsAWvljQM_2wj1K6ZHm5pNnqMCKFGbZbCJ4o66HObBQh4DF0NKHZY9PKm/exec";
const IMGBB_API_KEY = "9e2c45e20b2a686c19d3c0cc9cf06f9b"; 

// --- 2. Security Check & Settings Loader ---
window.onload = function() {
    // LocalStorage se saved password uthao
    const savedPass = localStorage.getItem('adminPassword') || "admin123";
    let pass = prompt("Enter Admin Password:");
    
    if (pass === savedPass) {
        document.body.style.display = "block";
        displayAdminProducts();
        refreshSettingsUI(); // UPI aur Password ko screen par dikhane ke liye
    } else {
        alert("Access Denied!");
        window.location.href = "index.html";
    }
};

// --- 2.1 Settings UI Refresh (Current Data dikhane ke liye) ---
function refreshSettingsUI() {
    // Current UPI dikhao
    const currentUPI = localStorage.getItem('ghabaUPI') || "Not Set";
    if(document.getElementById('adminUPI')) {
        document.getElementById('adminUPI').value = currentUPI;
    }

    // Current Password dikhao (Agar aapne HTML mein span id="currentPassText" banaya hai)
    const currentPass = localStorage.getItem('adminPassword') || "admin123";
    const passLabel = document.getElementById('currentPassText');
    if(passLabel) {
        passLabel.innerText = currentPass;
    }
}

// --- 2.2 Admin Settings Functions ---
function updateUPI() {
    const upi = document.getElementById('adminUPI').value.trim();
    if(upi) {
        localStorage.setItem('ghabaUPI', upi);
        alert("UPI ID Updated Successfully! ✅");
        refreshSettingsUI();
    } else {
        alert("Kripya UPI ID bhariye!");
    }
}

function updatePass() {
    const newPass = document.getElementById('adminPass').value.trim();
    if(newPass.length >= 4) {
        localStorage.setItem('adminPassword', newPass);
        alert("Admin Password Updated! ✅\nAb naya password hi use hoga.");
        document.getElementById('adminPass').value = ""; // Input clear karo
        refreshSettingsUI();
    } else {
        alert("Password kam se kam 4 characters ka rakhein!");
    }
}

/**
 * --- 3. Smart Cloud Upload (ImgBB) ---
 */
async function autoUrl(input, slot) {
    const file = input.files[0];
    if (!file) return;

    const previewImg = document.getElementById(`pre${slot}`);
    const urlInput = document.getElementById(`url${slot}`);
    const btnSpan = input.previousElementSibling; 

    if (btnSpan) btnSpan.innerText = "Wait...";
    if (previewImg) previewImg.style.opacity = "0.3";

    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            const onlineUrl = data.data.url;
            urlInput.value = onlineUrl;
            if (previewImg) {
                previewImg.src = onlineUrl;
                previewImg.style.opacity = "1";
            }
            if (btnSpan) btnSpan.innerText = "Done ✅";
        } else {
            alert("Upload Fail! Check ImgBB Key.");
            if (btnSpan) btnSpan.innerText = "Retry";
        }
    } catch (error) {
        console.error("ImgBB Error:", error);
        alert("Network Error! Photo upload nahi hui.");
    }
}

// --- 4. Save Product Logic ---
async function saveProduct() {
    const name = document.getElementById('pName').value.trim();
    const price = document.getElementById('pPrice').value.trim();
    const category = document.getElementById('pCategory').value;
    const video = document.getElementById('pVideo').value.trim();

    const gallery = [
        document.getElementById('url1').value,
        document.getElementById('url2').value,
        document.getElementById('url3').value,
        document.getElementById('url4').value,
        document.getElementById('url5').value
    ].filter(url => url.trim() !== "");

    if (!name || !price || gallery.length === 0) {
        alert("Please fill Name, Price and at least 1 Image!");
        return;
    }

    const submitBtn = document.querySelector('.btn-upload');
    const originalText = submitBtn.innerText;
    
    submitBtn.innerText = "PUBLISHING...";
    submitBtn.disabled = true;

    const newProduct = {
        id: Date.now(),
        name: name,
        price: price,
        category: category,
        mainImg: gallery[0],
        gallery: gallery, 
        video: video
    };

    try {
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        let products = JSON.parse(localStorage.getItem('myProducts')) || [];
        products.push(newProduct);
        localStorage.setItem('myProducts', JSON.stringify(products));

        alert("Product Published Successfully! ✅");
        resetAdminForm();
        displayAdminProducts();

    } catch (error) {
        console.error("Critical Error:", error);
        alert("Could not sync with Cloud. Product saved locally only.");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

// --- 5. Supporting Functions ---

function resetAdminForm() {
    document.getElementById('pName').value = "";
    document.getElementById('pPrice').value = "";
    document.getElementById('pVideo').value = "";
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`url${i}`).value = "";
        const pre = document.getElementById(`pre${i}`);
        if (pre) pre.src = "";
    }
    const fileBtns = document.querySelectorAll('.btn-file');
    fileBtns.forEach(btn => btn.innerText = "Gallery");
}

function displayAdminProducts() {
    const list = document.getElementById('adminProductList');
    if (!list) return;
    
    let products = JSON.parse(localStorage.getItem('myProducts')) || [];
    
    list.innerHTML = products.slice().reverse().map(p => `
        <div class="p-card">
            <button class="delete-btn" onclick="deleteProduct(${p.id})">×</button>
            <img src="${p.mainImg}" onerror="this.src='https://via.placeholder.com/150';">
            <p style="font-size:12px; font-weight:bold; margin: 5px 0; color:#333;">${p.name}</p>
            <p style="color:#ff4757; font-weight:bold; margin: 0;">₹${p.price}</p>
        </div>
    `).join('');
}

function deleteProduct(id) {
    if (confirm("Delete this product from view?")) {
        let products = JSON.parse(localStorage.getItem('myProducts')) || [];
        products = products.filter(p => p.id !== id);
        localStorage.setItem('myProducts', JSON.stringify(products));
        displayAdminProducts();
    }
}

function logout() { 
    window.location.href = "index.html"; 
}