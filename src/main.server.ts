/**
 * PUNTO DI INGRESSO DEL SERVER (SSR)
 * ─────────────────────────────────────────────────────────────────────────────
 * Come main.ts ma per Node.js. Angular SSR importa questo file per sapere
 * quale modulo usare per il rendering lato server.
 * Esporta AppServerModule come "default" — è la convenzione richiesta da Angular SSR.
 */

export { AppServerModule as default } from './app/app.module.server';
