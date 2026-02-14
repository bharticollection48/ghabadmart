// --- 1. CONFIGURATION ---
// DHAYAN DEIN: Google Script update karne ke baad naya URL yahan zaroor dalein
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQVeV9dCAOstzdZ6K4xDZ62NYtHf8d1E3jbSUyJaH-lnrL6FFgKHNXAQmP7mA4aMVM/exec";
const IMGBB_API_KEY = "9e2c45e20b2a686c19d3c0cc9cf06f9b"; 

// --- 2. Server se Fresh Settings Fetch Karna ---
async function fetchServerSettings() {
    try {
        // Cache bypass karne ke liye timestamp add kiya hai
        const response = await fetch(GOOGLE_SHEET_URL + "?t=" + Date.now());
        const data = await response.json();
        
        if (data.settings) {
            // IMPORTANT: Purana LocalStorage saaf karke naya data daalna
            localStorage.setItem('adminPassword', data.settings.password);
            localStorage.setItem('ghabaUPI', data.settings.upi);
            
            // UI Update (Labels)
            if(document.getElementById('currentUPIText')) document.getElementById('currentUPIText').innerText = data.settings.upi;
            if(document.getElementById('currentPassText')) document.getElementById('currentPassText').innerText = data.settings.password;
            if(document.getElementById('adminUPI')) document.getElementById('adminUPI').value = data.settings.upi;
        }
        return data.products || [];
    } catch (error) {
        console.error("Server Fetch Error:", error);
        return [];
    }
}

// --- 3. Security Check on Load (Force Server Check) ---
window.onload = async function() {
    // Page load hote hi pehle server se taaza password mangwao
    const serverProducts = await fetchServerSettings();
    
    // Ab wahi password uthayega jo abhi server se aaya hai
    const latestPass = localStorage.getItem('adminPassword') || "admin123";
    let userEntry = prompt("Enter Admin Password:");
    
    if (userEntry === latestPass) {
        document.body.style.display = "block";
        displayAdminProducts(serverProducts); 
    } else {
        alert("Access Denied! Galat Password ya Server Update nahi hua.");
        window.location.href = "index.html";
    }
};

// --- 4. Server Update Logic (Settings Sync) ---
async function syncSettingsToServer(newUpi, newPass) {
    const data = {
        type: "updateSettings",
        upi: newUpi,
        password: newPass
    };

    const passLabel = document.getElementById('currentPassText');
    if(passLabel) passLabel.innerText = "Syncing with Cloud...";

    try {
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors', 
            body: JSON.stringify(data)
        });

        alert("Server Updated! Ab sabhi devices par naya Password/UPI chalega. ✅");
        
        // Settings update hone ke baad fresh data fetch karo
        await fetchServerSettings();
        location.reload(); 
    } catch (error) {
        alert("Server error! Settings save nahi ho payi.");
        console.error(error);
    }
}

function updateUPI() {
    const upi = document.getElementById('adminUPI').value.trim();
    const currentPass = localStorage.getItem('adminPassword');
    if(upi) {
        syncSettingsToServer(upi, currentPass);
    } else {
        alert("UPI ID bhariye!");
    }
}

function updatePass() {
    const newPass = document.getElementById('adminPass').value.trim();
    const currentUPI = localStorage.getItem('ghabaUPI');
    if(newPass.length >= 4) {
        syncSettingsToServer(currentUPI, newPass);
    } else {
        alert("Password kam se kam 4 characters ka rakhein!");
    }
}

// --- 5. Photo Upload (ImgBB) ---
async function autoUrl(input, slot) {
    const file = input.files[0];
    if (!file) return;

    const previewImg = document.getElementById(`pre${slot}`);
    const urlInput = document.getElementById(`url${slot}`);
    const btnSpan = input.previousElementSibling; 

    if (btnSpan) btnSpan.innerText = "Uploading...";
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
            urlInput.value = data.data.url;
            if (previewImg) {
                previewImg.src = data.data.url;
                previewImg.style.opacity = "1";
            }
            if (btnSpan) btnSpan.innerText = "Done ✅";
        }
    } catch (error) {
        alert("Photo upload fail!");
        if (btnSpan) btnSpan.innerText = "Gallery";
    }
}

// --- 6. Save Product ---
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
        alert("Details bharo!");
        return;
    }

    const submitBtn = document.querySelector('.btn-upload');
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
            body: JSON.stringify(newProduct)
        });

        alert("Product Published! ✅");
        location.reload(); 
    } catch (error) {
        alert("Server error!");
    }
}

// --- 7. UI Helpers ---
function displayAdminProducts(products) {
    const list = document.getElementById('adminProductList');
    if (!list || !products) return;
    
    list.innerHTML = products.slice().reverse().map(p => `
        <div class="p-card">
            <img src="${p.mainImg}">
            <p style="font-size:12px; margin:5px 0;">${p.name}</p>
            <p style="color:#ff4757; font-weight:bold;">₹${p.price}</p>
        </div>
    `).join('');
}

function logout() { 
    localStorage.clear(); // Logout par sab saaf taaki security bani rahe
    window.location.href = "index.html"; 
}