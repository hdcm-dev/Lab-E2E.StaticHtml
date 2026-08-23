/**
 * Servidor estático mínimo, sin dependencias, para servir `src/` durante las pruebas.
 *
 *   node scripts/servidor.mjs            # http://127.0.0.1:4173
 *   PUERTO=8080 node scripts/servidor.mjs
 *
 * Playwright lo levanta solo a través de la sección `webServer` de playwright.config.js.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('../src', import.meta.url)));
const PUERTO = Number(process.env.PUERTO ?? 4173);
const HOST = process.env.HOST ?? '127.0.0.1';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2'
};

/** Resuelve la URL dentro de `src/` y rechaza cualquier salto fuera de la raíz. */
function rutaSegura(urlCruda) {
  const ruta = decodeURIComponent(new URL(urlCruda, 'http://local').pathname);
  const destino = resolve(join(RAIZ, normalize(ruta)));
  if (destino !== RAIZ && !destino.startsWith(RAIZ + sep)) return null;
  return destino;
}

const servidor = createServer(async (peticion, respuesta) => {
  const destino = rutaSegura(peticion.url ?? '/');
  if (!destino) {
    respuesta.writeHead(403).end('Prohibido');
    return;
  }

  let archivo = destino;
  try {
    const info = await stat(archivo);
    if (info.isDirectory()) archivo = join(archivo, 'index.html');
  } catch {
    respuesta.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('No encontrado');
    return;
  }

  try {
    const contenido = await readFile(archivo);
    respuesta.writeHead(200, {
      'content-type': TIPOS[extname(archivo)] ?? 'application/octet-stream',
      'cache-control': 'no-store'
    }).end(contenido);
  } catch {
    respuesta.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
});

servidor.listen(PUERTO, HOST, () => {
  console.log(`Sirviendo ${RAIZ} en http://${HOST}:${PUERTO}`);
});
