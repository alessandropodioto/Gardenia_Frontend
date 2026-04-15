/**
 * APP ROUTING MODULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Questo file definisce tutte le rotte dell'applicazione.
 *
 * CONCETTO — Come funziona il routing in Angular:
 * Il Router confronta l'URL del browser con l'array "routes" dall'alto verso
 * il basso e istanzia il componente della prima rotta che corrisponde.
 * RouterModule.forRoot() registra il router a livello di app (si usa una volta
 * sola; i moduli figli userebbero forChild()).
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductDetails } from './components/product-details/product-details';
import { HomeComponent } from './components/home/home';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Admin } from './components/admin/admin';
import { AdminGuard } from './guards/admin.guard';
import { CarrelloComponent } from './components/carrello/carrello';
import { PagamentoComponent } from './components/pagamento/pagamento';
import { User } from './components/user/user';
import { AddressComponent } from './components/address/address';
import { Overview } from './components/overview/overview';
import { OrdersComponent } from './components/orders/orders';
import { OrderDetail } from './components/order-detail/order-detail';
import { AboutUs } from './components/about-us/about-us';
import { EmailValidationComponent } from './email-validation/email-validation';
import { ResetPasswordComponent } from './components/reset-password/reset-password';
import { Wishlist } from './components/wishlist/wishlist';

const routes: Routes = [
  // Reindirizza la radice "/" verso "/home" (pathMatch: 'full' = deve combaciare l'intero URL)
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Pagina principale: mostra tutti i prodotti
  { path: 'home', component: HomeComponent },

  // Stessa HomeComponent riusata per il filtro per categoria/sottocategoria.
  // I parametri ":categoryName" e ":subcategoryName" appaiono nell'URL leggibile
  // (es. /category/Piante/Succulente), ma il filtro reale usa il queryParam
  // "?subcategoryId=X" aggiunto dal componente Header al momento della navigazione.
  { path: 'category/:categoryName/:subcategoryName', component: HomeComponent },

  { path: 'about-us', component: AboutUs },

  // Link di convalida email: l'ID (token) viene generato dal backend e inviato via email.
  // Il componente lo legge dall'URL e chiama l'API per attivare l'account.
  { path: 'emailValidation/:id', component: EmailValidationComponent },

  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // ":id" è un segmento dinamico — viene letto nel componente con ActivatedRoute
  { path: 'product/:id', component: ProductDetails },

  { path: 'cart', component: CarrelloComponent },

  // ROTTA PROTETTA: "canActivate" è un array di Guard che Angular esegue prima di
  // caricare il componente. Se AdminGuard restituisce false, la navigazione viene
  // bloccata e l'utente viene rimandato a /home.
  { path: 'admin', component: Admin, canActivate: [AdminGuard] },

  { path: 'pagamento', component: PagamentoComponent },

  // Link di reset password: il token ":id" arriva via email (analogo a emailValidation)
  { path: 'reset-password/:id', component: ResetPasswordComponent },

  {
    // ROTTE FIGLIE (children): il componente User fa da "shell" con un <router-outlet>
    // interno. Quando si naviga a /user/overview, Angular carica User come contenitore
    // e Overview dentro il suo <router-outlet>.
    // Questo evita di ricaricare la sidebar utente ad ogni cambio di sotto-pagina.
    path: 'user',
    component: User,
    children: [
      { path: 'overview', component: Overview },
      { path: 'address', component: AddressComponent },
      { path: 'orders', component: OrdersComponent },
      // ":id" permette di passare l'ID ordine: /user/orders/42
      { path: 'orders/:id', component: OrderDetail },
      { path: 'wishlist', component: Wishlist },
      // Se si naviga a /user senza sotto-percorso, redirect automatico a /user/overview
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  // RouterModule.forRoot registra il servizio Router e le direttive (routerLink, routerLinkActive...)
  imports: [RouterModule.forRoot(routes)],
  // Esportarlo rende disponibili routerLink e <router-outlet> in tutti i moduli che importano AppRoutingModule
  exports: [RouterModule],
})
export class AppRoutingModule {}
