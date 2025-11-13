// ============ CONFIGURACIÓN DE GOOGLE SHEETS ============
// ID de tu Google Sheet (solo el ID, sin la URL completa)
const SHEET_ID = "14iotnKK9nAGAxJHpbcz6ocgoxLSYambT8BnOorFqLvU";
const SHEET_NAME = "Tabla_1";

// Proxy CORS para evitar problemas de bloqueo
const CORS_PROXY = "https://api.allorigins.win/raw?url=";
const SHEET_URL = CORS_PROXY + encodeURIComponent(
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`
);

let inventarioCompleto = [];
let inventarioFiltrado = [];

// ============ CARGAR DATOS DESDE GOOGLE SHEETS ============
async function cargarInventario() {
    try {
        console.log('🔄 Intentando cargar desde Google Sheets...');
        console.log('📍 Sheet ID:', SHEET_ID);
        
        const response = await fetch(SHEET_URL);
        console.log('📡 Respuesta recibida, status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('📄 Datos recibidos (primeros 150 chars):', text.substring(0, 150));
        
        // Parsear la respuesta de Google Sheets
        // El formato es: /*O_o*/ google.visualization.Query.setResponse({...});
        // Necesitamos extraer solo el JSON que está dentro de los paréntesis
        let jsonText = text;
        
        // Remover el prefijo /*O_o*/
        jsonText = jsonText.replace(/^\/\*O_o\*\/\s*/, '');
        // Remover google.visualization.Query.setResponse(
        jsonText = jsonText.replace(/google\.visualization\.Query\.setResponse\(/, '');
        // Remover el paréntesis final
        jsonText = jsonText.replace(/\);?\s*$/, '');
        
        console.log('📄 JSON limpio (primeros 100 chars):', jsonText.substring(0, 100));
        
        const json = JSON.parse(jsonText);
        
        console.log('✅ JSON parseado correctamente');
        console.log('📊 Filas encontradas:', json.table.rows.length);
        
        // Mapear las columnas a objetos
        // A=0: Id_Element, B=1: Modulo, C=2: N°Locker, D=3: Items
        // E=4: Cantidad, F=5: id_imagen, G=6: Imagen, H=7: Clasificación
        inventarioCompleto = json.table.rows.map(row => ({
            id: row.c[0]?.v || '',
            modulo: row.c[1]?.v || '',
            locker: row.c[2]?.v || '',
            nombre: row.c[3]?.v || '',
            cantidad: row.c[4]?.v || 0,
            imagen: row.c[5]?.v || '',      // Columna F: id_imagen
            categoria: row.c[7]?.v || ''    // Columna H: Clasificación
        }));

        // Si estamos en la página de lockers, no mostrar todos los elementos automáticamente.
        const isLockerPage = window.location.href.includes('busqueda_locker.html');
        if (isLockerPage) {
            inventarioFiltrado = [];
            // No cargar categorías ni mostrar tarjetas para que el usuario ingrese locker
        } else {
            inventarioFiltrado = [...inventarioCompleto];
            // Cargar categorías en el dropdown
            cargarCategorias();
            // Mostrar las tarjetas
            mostrarTarjetas();
        }
        
        console.log('✅ Inventario cargado exitosamente:', inventarioCompleto.length, 'items');
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Stack:', error.stack);
        
        // Cargar datos de prueba para verificar el diseño
        console.log('⚠️ Cargando datos de prueba...');
            // Si hay error, cargar datos de prueba pero respetando la página locker
            cargarDatosPrueba();
    }
}

// ============ DATOS DE PRUEBA (TEMPORAL) ============
function cargarDatosPrueba() {
    inventarioCompleto = [
        {
            id: '1',
            modulo: '1',
            locker: '3255',
            nombre: 'Probetas 50ml',
            cantidad: 25,
            imagen: '',
            categoria: 'Vidriería'
        },
        {
            id: '2',
            modulo: '1',
            locker: '3270',
            nombre: 'Probetas 25ml',
            cantidad: 25,
            imagen: '',
            categoria: 'Vidriería'
        },
        {
            id: '3',
            modulo: '1',
            locker: '2464',
            nombre: 'Erlenmeyer 100ml',
            cantidad: 25,
            imagen: '',
            categoria: 'Vidriería'
        },
        {
            id: '4',
            modulo: '1',
            locker: '3254',
            nombre: 'Matraz 50ml',
            cantidad: 10,
            imagen: '',
            categoria: 'Vidriería'
        },
        {
            id: '5',
            modulo: '1',
            locker: '2373',
            nombre: 'Morteros',
            cantidad: 5,
            imagen: '',
            categoria: 'Herramientas y soportes'
        },
        {
            id: '6',
            modulo: '1',
            locker: '2447',
            nombre: 'Embudos',
            cantidad: 10,
            imagen: '',
            categoria: 'Vidriería'
        },
        {
            id: '7',
            modulo: '1',
            locker: '2447',
            nombre: 'Ampollas de decantación',
            cantidad: 5,
            imagen: '',
            categoria: 'Vidriería'
        },
        {
            id: '8',
            modulo: '1',
            locker: '2414',
            nombre: 'Tubos de ensayo',
            cantidad: 0,
            imagen: '',
            categoria: 'Vidriería'
        }
    ];
    
    const isLockerPage = window.location.href.includes('busqueda_locker.html');
    if (isLockerPage) {
        inventarioFiltrado = [];
        // No cargar categorías ni mostrar tarjetas
    } else {
        inventarioFiltrado = [...inventarioCompleto];
        cargarCategorias();
        mostrarTarjetas();
    }
    
    console.log('✅ Datos de prueba cargados');
}

// ============ CARGAR CATEGORÍAS EN EL DROPDOWN ============
function cargarCategorias() {
    const listaCategorias = document.getElementById('listaCategorias');
    
    // Obtener categorías únicas
    const categoriasUnicas = [...new Set(inventarioCompleto.map(item => item.categoria))];
    
    // Limpiar lista (mantener "Todas las Categorías")
    listaCategorias.innerHTML = '<li data-categoria="Todas las Categorías">Todas las Categorías</li>';
    
    // Agregar categorías únicas
    categoriasUnicas.forEach(categoria => {
        if (categoria) {
            const li = document.createElement('li');
            li.setAttribute('data-categoria', categoria);
            li.textContent = categoria;
            listaCategorias.appendChild(li);
        }
    });
}

// ============ MOSTRAR TARJETAS ============
function mostrarTarjetas() {
    const contenedor = document.querySelector('.lista-elementos');
    
    // Limpiar contenedor
    contenedor.innerHTML = '';
    
    // Si no hay items, mostrar mensaje
    if (inventarioFiltrado.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No se encontraron elementos</p>';
        return;
    }
    
    // Crear grid de tarjetas
    const grid = document.createElement('div');
    grid.className = 'tarjetas-grid';
    
    // Crear cada tarjeta
    inventarioFiltrado.forEach(item => {
        const tarjeta = crearTarjeta(item);
        grid.appendChild(tarjeta);
    });
    
    contenedor.appendChild(grid);
}

// ============ CREAR TARJETA INDIVIDUAL ============
function crearTarjeta(item) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-item';
    
    // NUEVO: Construir ruta de imagen desde la carpeta local
    let imagenSrc = '';
    if (item.imagen && item.imagen.trim() !== '') {
        // Si hay nombre de archivo, construir la ruta a la carpeta ImagenesElementos
        imagenSrc = `ImagenesElementos/${item.imagen}`;
    } else {
        // Si no hay imagen, usar placeholder
        imagenSrc = 'https://placehold.co/200x200/e3f4fb/2ba1d8?text=Sin+Imagen&font=roboto';
    }
    
    tarjeta.innerHTML = `
        <div class="tarjeta-imagen-container">
            <img src="${imagenSrc}" 
                 alt="${item.nombre}" 
                 onerror="this.onerror=null; this.src='https://placehold.co/200x200/e3f4fb/2ba1d8?text=Sin+Imagen&font=roboto';">
        </div>
        <div class="tarjeta-info">
            <div class="tarjeta-nombre">${item.nombre}</div>
            <div class="tarjeta-detalle"><strong>Categoría:</strong> ${item.categoria}</div>
            <div class="tarjeta-detalle"><strong>Locker:</strong> ${item.locker}</div>
            <div class="tarjeta-detalle"><strong>Cantidad:</strong> ${item.cantidad}</div>
        </div>
    `;
    
    return tarjeta;
}

// ============ MENSAJE DE ERROR ============
function mostrarMensajeError() {
    const contenedor = document.querySelector('.lista-elementos');
    contenedor.innerHTML = `
        <div style="background-color: #ffebee; border: 2px solid #ef5350; border-radius: 15px; padding: 20px; text-align: center;">
            <h3 style="color: #c62828; margin-bottom: 10px;">⚠️ Error al cargar datos</h3>
            <p style="color: #666;">Verifica que el Google Sheet esté público y la URL sea correcta.</p>
        </div>
    `;
}

// ============ FILTRAR ELEMENTOS ============
function filtrarElementos() {
    const textoBusqueda = document.querySelector('.buscador input').value.toLowerCase();
    const categoriaSeleccionada = document.getElementById('categoriaSeleccionada').textContent;
    
    inventarioFiltrado = inventarioCompleto.filter(item => {
        // Filtro por texto de búsqueda
        const coincideTexto = 
            item.nombre.toLowerCase().includes(textoBusqueda) ||
            item.categoria.toLowerCase().includes(textoBusqueda) ||
            item.locker.toString().includes(textoBusqueda);
        
        // Filtro por categoría
        const coincideCategoria = 
            categoriaSeleccionada === 'Todas las Categorías' || 
            item.categoria === categoriaSeleccionada;
        
        return coincideTexto && coincideCategoria;
    });
    
    mostrarTarjetas();
}

// ============ EVENT LISTENERS ============
document.addEventListener('DOMContentLoaded', function() {
    
    // Cargar inventario al iniciar
    cargarInventario();
    
    // Buscador
    const inputBusqueda = document.querySelector('.buscador input');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', filtrarElementos);
    }
    
    // Dropdown de categorías
    const dropdown = document.getElementById('categoriaDropdown');
    const listaCategorias = document.getElementById('listaCategorias');
    const categoriaSeleccionada = document.getElementById('categoriaSeleccionada');
    
    if (dropdown) {
        dropdown.addEventListener('click', function() {
            listaCategorias.classList.toggle('visible');
        });
    }
    
    // Seleccionar categoría
    if (listaCategorias) {
        listaCategorias.addEventListener('click', function(e) {
            if (e.target.tagName === 'LI') {
                const categoria = e.target.getAttribute('data-categoria');
                categoriaSeleccionada.textContent = categoria;
                listaCategorias.classList.remove('visible');
                filtrarElementos();
            }
        });
    }
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            listaCategorias.classList.remove('visible');
        }
    });
    
});