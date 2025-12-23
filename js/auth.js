// js/auth.js
import { auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, doc, setDoc, getDoc } from './firebase-config.js';

// Елементи UI (спільні для обох сторінок)
const loginBtn = document.getElementById('loginBtn');
const mobileLoginBtn = document.getElementById('mobileLoginBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Змінна для збереження поточного користувача
let currentUser = null;

// Слухаємо зміни стану входу
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("User logged in:", user.email);
        
        // Отримуємо додаткові дані (роль) з бази
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            currentUser.role = userDoc.data().role;
        }
        
        updateAuthUI(true);
    } else {
        currentUser = null;
        console.log("User logged out");
        updateAuthUI(false);
    }
});

function updateAuthUI(isLoggedIn) {
    if (isLoggedIn) {
        const displayText = currentUser.email.split('@')[0]; // Показуємо частину пошти як ім'я
        if (loginBtn) {
            loginBtn.textContent = displayText;
            loginBtn.onclick = handleLogout;
        }
        if (mobileLoginBtn) {
            mobileLoginBtn.textContent = displayText;
            mobileLoginBtn.onclick = handleLogout;
        }
        
        // Якщо ми на сторінці маркетплейсу, показуємо кнопку "Add Service" для провайдерів
        const becomeProviderBtn = document.getElementById('becomeProviderBtn');
        if (becomeProviderBtn && currentUser.role === 'provider') {
            becomeProviderBtn.textContent = '+ Add Service';
            becomeProviderBtn.onclick = () => document.getElementById('addServiceModal').classList.remove('hidden');
        }
    } else {
        if (loginBtn) {
            loginBtn.textContent = 'Sign In';
            loginBtn.onclick = () => openModal('loginModal');
        }
        if (mobileLoginBtn) {
            mobileLoginBtn.textContent = 'Sign In';
            mobileLoginBtn.onclick = () => openModal('loginModal');
        }
    }
}

// Логін
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            closeModal('loginModal');
            // Якщо логін на головній, перекидаємо на маркетплейс
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
                window.location.href = 'marketplace.html';
            }
        } catch (error) {
            alert("Error: " + error.message);
        }
    });
}

// Реєстрація
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        const role = e.target.querySelector('input[name="role"]:checked').value;
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Зберігаємо роль користувача в базі даних
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                role: role,
                createdAt: new Date()
            });
            
            closeModal('registerModal');
            window.location.href = 'marketplace.html';
        } catch (error) {
            alert("Registration Error: " + error.message);
        }
    });
}

async function handleLogout() {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        console.error("Logout error", error);
    }
}

// Утиліти для модалок (глобальні)
window.openModal = (modalId) => {
    document.getElementById(modalId).classList.remove('hidden');
};

window.closeModal = (modalId) => {
    document.getElementById(modalId).classList.add('hidden');
};

// Закриття по кліку на хрестик або фон
document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', function() {
        this.closest('.modal').classList.add('hidden');
    });
});
