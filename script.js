// Google Sheets data fetching and inventory management script
// To replace the Google Sheet URL, update the sheetURL variable below with your new sheet's URL
// Make sure the sheet is publicly accessible and the sheet name is correct

// URL de tu Google Sheet - Ya está configurada correctamente
// IMPORTANTE: La hoja debe estar en modo "Cualquier persona con el enlace puede ver"
const sheetURL = "https://docs.google.com/spreadsheets/d/16mhu6PaTaq1mkVSE8cDVnR9KTFcg3VfP4Fg4U3o5Dwg/gviz/tq?tqx=out:json&sheet=Tabla_1";

let inventoryData = [];
let filteredData = [];

// Fetch data from Google Sheets using Visualization API
async function loadInventory() {
    try {
        const response = await fetch(sheetURL);
        const text = await response.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        // Mapeo de columnas del Google Sheet (índice empieza en 0):
        // c[0] = Columna A: Id_Elemento
        // c[1] = Columna B: Modulo
        // c[2] = Columna C: N°Locker
        // c[3] = Columna D: Items
        // c[4] = Columna E: Cantidad
        // c[5] = Columna F: Imagen (URL de Google Drive)
        // c[6] = Columna G: Clasificación
        const rows = json.table.rows.map(r => ({
            id: r.c[0]?.v || '',
            modulo: r.c[1]?.v || '',
            locker: r.c[2]?.v || '',
            item: r.c[3]?.v || '',
            cantidad: r.c[4]?.v || 0,
            imagen: r.c[5]?.v || '',
            clasificacion: r.c[6]?.v || ''
        }));

        inventoryData = rows;
        filteredData = [...inventoryData];
        populateCategories();
        displayItems(filteredData);
    } catch (error) {
        console.error('Error loading inventory from Google Sheets:', error);
        // Fallback to sample data if Google Sheets fetch fails
        loadSampleData();
    }
}

// Fallback sample data for testing
function loadSampleData() {
    inventoryData = [
        {
            id: '1',
            modulo: 'A',
            locker: '3230',
            item: 'Microscopio Óptico',
            cantidad: 2,
            imagen: '',
            clasificacion: 'Biología'
        },
        {
            id: '2',
            modulo: 'B',
            locker: '2345',
            item: 'Probetas',
            cantidad: 0,
            imagen: '',
            clasificacion: 'Química'
        },
        {
            id: '3',
            modulo: 'C',
            locker: '1122',
            item: 'Balanza',
            cantidad: 3,
            imagen: '',
            clasificacion: 'Equipo de medición'
        }
    ];
    filteredData = [...inventoryData];
    populateCategories();
    displayItems(filteredData);
}

// Populate category dropdown with unique classifications
function populateCategories() {
    const categorySelect = document.getElementById('categorySelect');
    const categories = [...new Set(inventoryData.map(item => item.clasificacion))].filter(cat => cat);
    categorySelect.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Display inventory items in the grid - NUEVO DISEÑO VERTICAL
function displayItems(items) {
    const grid = document.getElementById('inventoryGrid');
    grid.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';

        // Determine status based on quantity
        const status = item.cantidad > 0 ? 'Disponible' : 'En Uso';
        const statusClass = item.cantidad > 0 ? 'status-available' : 'status-in-use';

        // Use local image fallback if imagen is empty
        const imageSrc = item.imagen || 'recursos/default-item.png';

        // NUEVO HTML con diseño vertical como en la imagen
        card.innerHTML = `
            <span class="item-status ${statusClass}">${status}</span>
            <div class="item-image-container">
                <img src="${imageSrc}" alt="${item.item}" class="item-image" onerror="this.src='recursos/default-item.png'">
            </div>
            <div class="item-info">
                <div class="item-name">${item.item}</div>
                <div class="item-details"><strong>Categoría:</strong> ${item.clasificacion}</div>
                <div class="item-details"><strong>Locker:</strong> ${item.locker}</div>
                <div class="item-details"><strong>Cantidad:</strong> ${item.cantidad}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Filter items based on search input and category selection
function filterItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('categorySelect').value;

    filteredData = inventoryData.filter(item => {
        const matchesSearch = item.item.toLowerCase().includes(searchTerm) ||
                            item.clasificacion.toLowerCase().includes(searchTerm) ||
                            item.locker.toString().toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || item.clasificacion === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    displayItems(filteredData);
}

// Event listeners for search and filter
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categorySelect');

    if (searchInput) {
        searchInput.addEventListener('input', filterItems);
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', filterItems);
    }

    // Load inventory data on page load
    loadInventory();
});