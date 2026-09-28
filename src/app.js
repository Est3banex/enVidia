import { obtenerCatalogo, hayStockSuficiente, obtenerProducto } from './catalogo.js';
import { procesarOrden, obtenerHistorialCompras } from './checkout.js';
import { suscribirBoletin } from './comunicaciones.js';

let carrito = [];

// DOM: Elementos principales
const catalogContainer = document.getElementById('catalog-container');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const btnCheckout = document.getElementById('btn-checkout');
const btnSubscribe = document.getElementById('btn-subscribe');

// DOM: Botón e Historial Modal
const btnShowHistory = document.getElementById('btn-show-history');
const historyModal = document.getElementById('history-modal');
const btnCloseHistory = document.getElementById('btn-close-history');
const modalHistoryContainer = document.getElementById('modal-history-container');
const modalUserEmail = document.getElementById('modal-user-email');

// DOM: Errores
const checkoutError = document.getElementById('checkout-error');
const newsletterError = document.getElementById('newsletter-error');

// DOM: Modal Checkout
const checkoutModal = document.getElementById('checkout-modal');
const modalStepPayment = document.getElementById('modal-step-payment');
const modalStepReceipt = document.getElementById('modal-step-receipt');
const btnConfirmPayment = document.getElementById('btn-confirm-payment');
const btnCancelPayment = document.getElementById('btn-cancel-payment');
const btnContinueShopping = document.getElementById('btn-continue-shopping');
const paymentError = document.getElementById('payment-error');


// --- RENDERIZADO DE VISTAS ---

function renderizarCatalogo() {
    catalogContainer.innerHTML = '';
    const productos = obtenerCatalogo();
    
    productos.forEach(prod => {
        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
            <div>
                <strong>${prod.nombre}</strong> <span class="badge">${prod.categoria}</span><br>
                <small>Precio: $${prod.precio} | Stock: ${prod.stock}</small>
            </div>
            <button ${prod.stock === 0 ? 'disabled' : ''} data-id="${prod.id}">
                ${prod.stock === 0 ? 'Agotado' : 'Añadir'}
            </button>
        `;
        catalogContainer.appendChild(div);
    });
}

function renderizarCarrito() {
    cartItems.innerHTML = '';
    let total = 0;
    
    if (carrito.length === 0) {
        cartItems.innerHTML = '<li style="color: #666;">El carrito está vacío</li>';
        cartTotal.textContent = '0';
        return;
    }

    carrito.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.nombre} - $${item.precio}</span>
            <button class="btn-remove" data-index="${index}">Quitar</button>
        `;
        cartItems.appendChild(li);
        total += item.precio;
    });
    
    cartTotal.textContent = total;
}

// Función que actualiza los datos del modal de historial
function actualizarDatosHistorial() {
    const compras = obtenerHistorialCompras();
    
    if (compras.length > 0) {
        btnShowHistory.style.display = 'block'; // Revela el botón superior
        
        // Asignar el email de la compra más reciente
        const ultimaCompra = compras[compras.length - 1];
        modalUserEmail.textContent = `Correo registrado: ${ultimaCompra.email}`;

        modalHistoryContainer.innerHTML = '';
        
        [...compras].reverse().forEach(orden => {
            const div = document.createElement('div');
            div.className = 'history-card';
            
            const listaItems = orden.items.map(i => `${i.nombre}`).join(', ');
            
            div.innerHTML = `
                <strong>Orden ${orden.id}</strong> <small style="color: #aaa;">(${orden.fecha})</small><br>
                <small style="color: #ccc;">Items: ${listaItems}</small><br>
                <small style="color: #88d300;">Total Pagado: $${orden.total}</small>
            `;
            modalHistoryContainer.appendChild(div);
        });
    }
}

// --- EVENTOS INTERACTIVOS ---

// Catálogo y Carrito
catalogContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const id = parseInt(e.target.getAttribute('data-id'));
        const cantidadEnCarrito = carrito.filter(p => p.id === id).length;
        
        if (hayStockSuficiente(id, cantidadEnCarrito + 1)) {
            carrito.push(obtenerProducto(id));
            checkoutError.textContent = ''; 
            renderizarCarrito();
        } else {
            checkoutError.textContent = 'Límite de stock alcanzado para este producto.';
        }
    }
});

cartItems.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove')) {
        const index = parseInt(e.target.getAttribute('data-index'));
        carrito.splice(index, 1);
        checkoutError.textContent = '';
        renderizarCarrito();
    }
});

// Modal de Checkout
btnCheckout.addEventListener('click', () => {
    const email = document.getElementById('checkout-email').value.trim();
    const direccion = document.getElementById('checkout-address').value.trim();
    
    checkoutError.textContent = ''; 

    if (carrito.length === 0) {
        checkoutError.textContent = 'El carrito está vacío. Añade productos.';
        return;
    }
    if (!email || !direccion) {
        checkoutError.textContent = 'Ingresa tu correo y dirección para continuar.';
        return;
    }

    paymentError.textContent = '';
    modalStepPayment.style.display = 'block';
    modalStepReceipt.style.display = 'none';
    checkoutModal.classList.add('active');
});

btnCancelPayment.addEventListener('click', () => {
    checkoutModal.classList.remove('active');
    paymentError.textContent = '';
});

btnConfirmPayment.addEventListener('click', () => {
    const cardName = document.getElementById('card-name').value.trim();
    const cardNumber = document.getElementById('card-number').value.trim();
    const email = document.getElementById('checkout-email').value.trim();
    const direccion = document.getElementById('checkout-address').value.trim();

    paymentError.textContent = '';

    if (!cardName || !cardNumber) {
        paymentError.textContent = 'Ingresa datos de tarjeta ficticios.';
        return;
    }

    const resultado = procesarOrden(carrito, email, direccion);

    if (resultado.exito) {
        const receiptList = document.getElementById('receipt-items');
        receiptList.innerHTML = '';
        
        carrito.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.nombre} — $${item.precio}`;
            receiptList.appendChild(li);
        });

        document.getElementById('receipt-address').textContent = resultado.orden.direccion;
        document.getElementById('receipt-total').textContent = `${resultado.orden.total} (incluye envío)`;

        modalStepPayment.style.display = 'none';
        modalStepReceipt.style.display = 'block';
        
        // Preparar el historial en memoria para cuando el usuario quiera consultarlo
        actualizarDatosHistorial();
    } else {
        paymentError.textContent = resultado.mensaje;
    }
});

btnContinueShopping.addEventListener('click', () => {
    carrito = [];
    document.getElementById('checkout-email').value = '';
    document.getElementById('checkout-address').value = '';
    document.getElementById('card-name').value = '';
    document.getElementById('card-number').value = '';
    document.getElementById('card-exp').value = '';
    document.getElementById('card-cvv').value = '';
    checkoutError.textContent = '';
    paymentError.textContent = '';

    // Cerrar el modal
    checkoutModal.classList.remove('active');
    
    // Forzar actualización visual al cerrar
    actualizarDatosHistorial();
    renderizarCarrito();
    renderizarCatalogo();
});

// Modal de Historial
btnShowHistory.addEventListener('click', () => {
    historyModal.classList.add('active');
});

btnCloseHistory.addEventListener('click', () => {
    historyModal.classList.remove('active');
});

// Newsletter
btnSubscribe.addEventListener('click', () => {
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput.value.trim();
    newsletterError.textContent = '';

    if (email === '') {
        newsletterError.textContent = 'Por favor, ingresa un correo electrónico.';
        return;
    }

    suscribirBoletin(email);
    emailInput.value = '';
    newsletterError.style.color = '#88d300';
    newsletterError.textContent = '¡Suscripción exitosa!';
    setTimeout(() => {
        newsletterError.textContent = '';
        newsletterError.style.color = '#ff4d4d'; 
    }, 3000);
});

// --- INICIALIZACIÓN ---
renderizarCatalogo();
renderizarCarrito();