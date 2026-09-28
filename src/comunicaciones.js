export function notificarCompraPorCorreo(email, detallesPedido, total) {
    // Simula la salida de envío por correo únicamente en consola (sin alerts del navegador)
    console.log(`[SMTP SIMULADO] Enviando recibo a: ${email}`);
    console.log(`[SMTP SIMULADO] Asunto: Tu compra en enVidia`);
    console.log(`[SMTP SIMULADO] Cuerpo: ${detallesPedido}. Total cobrado: $${total}`);
}

export function suscribirBoletin(email) {
    // Simula el registro en lista de correos en consola
    console.log(`[NEWSLETTER] Correo ${email} añadido a la base de datos de marketing.`);
}