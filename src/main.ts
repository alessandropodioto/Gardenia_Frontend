/**
 * PUNTO DI INGRESSO DELL'APP NEL BROWSER
 * ─────────────────────────────────────────────────────────────────────────────
 * Questo è il primo file eseguito quando l'app Angular parte nel browser.
 * platformBrowser().bootstrapModule(AppModule) avvia l'app:
 * Angular cerca <app-root> in index.html e ci mette il componente App.
 * .catch() cattura eventuali errori di avvio e li mostra in console.
 */

import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule, {

})
  .catch(err => console.error(err));
