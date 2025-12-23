// js/app.js
import { db, auth, collection, getDocs, addDoc, serverTimestamp, query, orderBy } from './firebase-config.js';

const servicesGrid = document.getElementById('servicesGrid');
const addServiceForm = document.getElementById('addServiceForm');

// Завантаження сервісів при старті
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    fetchServices();
});

// Функція отримання сервісів з Firebase
async function fetchServices() {
    servicesGrid.innerHTML = '<div class="col-span-full text-center text-gray-400">Loading services...</div>';
    
    try {
        const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        servicesGrid.innerHTML = '';
        
        if (querySnapshot.empty) {
            servicesGrid.innerHTML = '<div class="col-span-full text-center text-gray-400">No services found yet. Be the first to add one!</div>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const service = doc.data();
            service.id = doc.id; // Додаємо ID документа
            servicesGrid.appendChild(createServiceCard(service));
        });
        
        lucide.createIcons();
    } catch (error) {
        console.error("Error loading services:", error);
        servicesGrid.innerHTML = '<div class="col-span-full text-center text-red-400">Error loading services.</div>';
    }
}

// Створення HTML картки (те саме, що було, але адаптовано)
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    
    // Іконки категорій
    const icons = {
        'Content': 'image', 'Copywriting': 'file-text', 'Design': 'palette',
        'Analytics': 'bar-chart', 'Video': 'video', 'Translation': 'languages',
        'Business': 'briefcase', 'Programming': 'code'
    };
    const iconName = icons[service.category] || 'cpu';

    card.innerHTML = `
        <div class="service-image">
            <div class="flex items-center justify-center h-full">
                <i data-lucide="${iconName}" class="w-12 h-12 text-blue-400"></i>
            </div>
        </div>
        <div class="service-content">
            <h3 class="service-title">${service.title}</h3>
            <div class="service-price">${service.price} UAH</div>
            <div class="service-provider">Provider: ${service.providerName || 'Unknown'}</div>
            <p class="text-sm text-gray-400 mb-4 line-clamp-2">${service.description}</p>
            <button class="service-order-btn" onclick="alert('Order functionality coming soon!')">
                Order Now
            </button>
        </div>
    `;
    return card;
}

// Додавання нового сервісу
if (addServiceForm) {
    addServiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!auth.currentUser) {
            alert("Please login first");
            return;
        }

        const title = document.getElementById('serviceTitle').value;
        const price = Number(document.getElementById('servicePrice').value);
        const description = document.getElementById('serviceDescription').value;
        // Можна додати селект для категорії в HTML, поки хардкод або "General"
        const category = document.getElementById('categorySelect') ? document.getElementById('categorySelect').value : "Programming"; 

        const submitBtn = addServiceForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';

        try {
            await addDoc(collection(db, "services"), {
                title,
                price,
                description,
                category,
                providerId: auth.currentUser.uid,
                providerName: auth.currentUser.email.split('@')[0], // Або ім'я з профілю
                createdAt: serverTimestamp()
            });
            
            alert("Service added successfully!");
            document.getElementById('addServiceModal').classList.add('hidden');
            addServiceForm.reset();
            fetchServices(); // Оновити список
        } catch (error) {
            console.error("Error adding service:", error);
            alert("Error: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Service';
        }
    });

}
