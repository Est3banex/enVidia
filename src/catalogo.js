// Base de datos en memoria con diversidad de Hardware enVidia
const productos = [
    { id: 1, nombre: "GeForce RTX 5090", categoria: "GPU", precio: 1999, stock: 3 },
    { id: 2, nombre: "Grace CPU Superchip", categoria: "CPU", precio: 4500, stock: 2 },
    { id: 3, nombre: "BlueField-3 DPU", categoria: "Red / DPU", precio: 2100, stock: 5 },
    { id: 4, nombre: "Jetson Orin Nano Developer Kit", categoria: "Embedded / IA", precio: 499, stock: 8 },
    { id: 5, nombre: "Mellanox ConnectX-7 SmartNIC", categoria: "Red", precio: 1200, stock: 0 } // Sin stock
];

export function obtenerCatalogo() {
    return productos;
}

export function obtenerProducto(id) {
    return productos.find(p => p.id === id);
}

export function hayStockSuficiente(id, cantidadRequerida) {
    const producto = obtenerProducto(id);
    return producto && producto.stock >= cantidadRequerida;
}

export function descontarStock(id, cantidad) {
    const producto = obtenerProducto(id);
    if (producto && producto.stock >= cantidad) {
        producto.stock -= cantidad;
        return true;
    }
    return false;
}