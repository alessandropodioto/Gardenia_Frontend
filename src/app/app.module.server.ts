/**
 * APP SERVER MODULE — MODULO USATO SOLO DAL SERVER (SSR)
 * ─────────────────────────────────────────────────────────────────────────────
 * Questo modulo è la versione "server" di AppModule.
 * Importa AppModule (che contiene tutta l'app) e aggiunge solo i provider
 * necessari per il rendering lato server.
 *
 * provideServerRendering(withRoutes(serverRoutes)):
 * Attiva il SSR e registra le regole di rendering per ogni route
 * (definite in app.routes.server.ts).
 *
 * bootstrap: [App] → stesso componente radice del browser, coerenza garantita.
 */

import { NgModule } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { App } from './app';
import { AppModule } from './app-module';
import { serverRoutes } from './app.routes.server';

@NgModule({
  imports: [AppModule],
  providers: [
    provideServerRendering(withRoutes(serverRoutes))
  ],
  bootstrap: [App],
})
export class AppServerModule {}
