import { descontarStock } from './catalogo.js';
import { notificarCompraPorCorreo } from './comunicaciones.js';

const TARIFA_ENVIO = 50;

// Estado en memoria para persistir las compras mientras la pestaña esté abierta
const historialCompras = [];

export function procesarOrden(carrito, email, direccion) {
    if (carrito.length === 0) return { exito: false, mensaje: "El carrito está vacío" };
    if (!email || !direccion) return { exito: false, mensaje: "Faltan datos de envío o correo" };

    let subtotal = 0;
    const itemsProcesados = [];

    // 1. Validar y descontar stock real en catálogo
    for (const item of carrito) {
        const descontado = descontarStock(item.id, 1);
        if (!descontado) {
            return { exito: false, mensaje: `Fallo de inventario: No hay stock para ${item.nombre}` };
        }
        subtotal += item.precio;
        itemsProcesados.push({ nombre: item.nombre, precio: item.precio });
    }

    const totalAPagar = subtotal + TARIFA_ENVIO;

    // 2. Registrar la orden en el historial local (Persistencia del perfil)
    const nuevaOrden = {
        id: `ENV-${Date.now().toString().slice(-4)}`,
        fecha: new Date().toLocaleString(),
        items: itemsProcesados,
        total: totalAPagar,
        direccion,
        email
    };
    historialCompras.push(nuevaOrden);

    // 3. Intento de notificación tolerante a fallos
    try {
        const detalles = `Tus productos están siendo enviados a ${direccion}`;
        notificarCompraPorCorreo(email, detalles, totalAPagar);
    } catch (error) {
        // Si comunicaciones.js falla, la compra sigue siendo válida.
        console.warn("[CHECKOUT] El driver de correos falló, pero la compra se guardó en el perfil.");
    }

    return { exito: true, mensaje: "Compra procesada", orden: nuevaOrden };
}

// Función expuesta para la interfaz de historial
export function obtenerHistorialCompras() {
    return historialCompras;
}