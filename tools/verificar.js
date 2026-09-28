// VERIFICADOR DE ARQUITECTURA · uso general
// Lee arquitectura/reglas.json y revisa imports y comportamiento de src/
// Sale 0 si todo bien, 1 si alguna regla se violó.
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const RAIZ = 'src';
const REGLAS = 'arquitectura/reglas.json';

function archivos(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(archivos(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function importesDe(archivo) {
  const txt = fs.readFileSync(archivo, 'utf8');
  const re = /from\s+['"]([^'"]+)['"]/g;
  const out = []; let m;
  while ((m = re.exec(txt)) !== null) out.push(m[1]);
  return out;
}

if (!fs.existsSync(REGLAS)) {
  console.error('No encuentro ' + REGLAS);
  process.exit(1);
}

const reglas = JSON.parse(fs.readFileSync(REGLAS, 'utf8'));
const lista = fs.existsSync(RAIZ) ? archivos(RAIZ) : [];

if (lista.length === 0) {
  console.error('No encontre archivos .js en ' + RAIZ + '/. Revise la estructura.');
  process.exit(1);
}

console.log('\n  Revisando ' + lista.length + ' archivos contra ' + reglas.length + ' regla(s)...\n');

let violaciones = 0;

for (const r of reglas) {
  // ----------------------------------------------------
  // TIPO 1: Verificación Estática de Importaciones
  // ----------------------------------------------------
  if (r.tipo === 'importacion') {
    let mala = null;
    for (const f of lista) {
      const nombre = path.basename(f, '.js');
      if (nombre !== r.modulo && !f.includes(path.sep + r.modulo)) continue;
      for (const imp of importesDe(f)) {
        for (const prohibido of r.no_puede_importar) {
          if (imp.includes(prohibido)) { mala = { f, imp, prohibido }; break; }
        }
        if (mala) break;
      }
      if (mala) break;
    }

    if (mala) {
      violaciones++;
      console.log('  [X] ' + r.id + ' VIOLADA  (' + r.adr + ')');
      console.log('      Archivo: ' + mala.f);
      console.log('      "' + r.modulo + '" esta importando a "' + mala.prohibido + '", y no puede.');
      console.log('      Por que existe esta regla: ' + r.porque + '\n');
    } else {
      console.log('  [OK] ' + r.id + ' (' + r.adr + ') · ' + r.modulo + ' no importa a ' + r.no_puede_importar.join(', '));
    }
  }

  // ----------------------------------------------------
  // TIPO 2: Verificación Funcional y Resiliencia
  // ----------------------------------------------------
  else if (r.tipo === 'funcional') {
    try {
      if (r.prueba === 'inventario_dinamico') {
        // Cargar el módulo dinámicamente
        const moduloCatalogo = await import('../src/catalogo.js');
        const prod = moduloCatalogo.obtenerProducto(1);
        const stockPrevio = prod.stock;

        // Probar descuento
        moduloCatalogo.descontarStock(1, 1);
        const prodDespues = moduloCatalogo.obtenerProducto(1);

        assert.strictEqual(prodDespues.stock, stockPrevio - 1, 'El stock no se redujo correctamente.');
        console.log('  [OK] ' + r.id + ' (' + r.adr + ') · ' + r.modulo + ' actualiza dinámicamente el inventario.');
      } 
      else if (r.prueba === 'resiliencia_historial') {
        // Cargar el módulo checkout
        const moduloCheckout = await import('../src/checkout.js');
        const carritoTest = [{ id: 1, nombre: 'Test GPU', precio: 100 }];
        const emailTest = 'test-ci@envidia.com';

        // Procesar orden
        const res = moduloCheckout.procesarOrden(carritoTest, emailTest, 'Dirección Test');
        const historial = moduloCheckout.obtenerHistorialCompras();

        assert.strictEqual(res.exito, true, 'La compra falló en el checkout');
        assert.ok(historial.some(o => o.email === emailTest), 'La orden no se persistió en el historial');
        
        console.log('  [OK] ' + r.id + ' (' + r.adr + ') · ' + r.modulo + ' mantiene resiliencia e historial de compras.');
      }
    } catch (err) {
      violaciones++;
      console.log('  [X] ' + r.id + ' VIOLADA  (' + r.adr + ')');
      console.log('      Fallo en la prueba funcional: ' + err.message);
      console.log('      Por que existe esta regla: ' + r.porque + '\n');
    }
  }
}

if (violaciones > 0) {
  console.log('\n  ARQUITECTURA VIOLADA: ' + violaciones + ' problema(s). El despliegue se detiene.\n');
  process.exit(1);
}

console.log('\n  ARQUITECTURA RESPETADA. El cambio puede desplegarse.\n');
process.exit(0);