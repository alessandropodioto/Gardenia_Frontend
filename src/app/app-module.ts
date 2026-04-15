/**
 * APP MODULE — Modulo radice dell'applicazione
 * ─────────────────────────────────────────────────────────────────────────────
 * CONCETTO — NgModule (architettura classica, non standalone):
 * In Angular ogni componente deve appartenere a un modulo. AppModule è il modulo
 * radice: viene caricato per primo e fa da punto di ingresso dell'applicazione.
 *
 * Le quattro sezioni principali di un @NgModule:
 *   declarations  → componenti, direttive e pipe che appartengono a questo modulo
 *   imports       → altri moduli da cui vogliamo usare funzionalità (Material, Router…)
 *   providers     → servizi registrati a livello di modulo (alternativa a providedIn:'root')
 *   bootstrap     → il componente radice che Angular istanzia all'avvio (App)
 *
 * Nota: i servizi con { providedIn: 'root' } (es. AuthService, CartService…) si
 * auto-registrano nell'iniettore globale e NON vanno messi in providers qui.
 * AuthService è però elencato esplicitamente per storicità del progetto.
 */

import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// --- Angular Material ---
// Ogni modulo Material espone i componenti UI di quella "famiglia" (es. MatDialogModule
// espone <mat-dialog>, MatTableModule espone <mat-table>, ecc.)
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';

import { AppRoutingModule } from './app-routing-module';

// --- Componenti dell'applicazione ---
import { App } from './app';
import { ProductDetails } from './components/product-details/product-details';
import { HeaderComponent } from './components/header/header';
import { Footer } from './components/footer/footer';
import { HomeComponent } from './components/home/home';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { AuthService } from './services/auth.service';
import { CarrelloComponent } from './components/carrello/carrello';
import { Admin } from './components/admin/admin';
import { AdminSidebar } from './components/admin-sidebar/admin-sidebar';
import { DeleteUser } from './dialogs/delete-user/delete-user';
import { EditProfile } from './dialogs/edit-profile/edit-profile';
import { ProductDialog } from './dialogs/product-dialog/product-dialog';
import { AddressDialog } from './dialogs/address-dialog/address-dialog';
import { DeleteAddress } from './dialogs/delete-address/delete-address';
import { PagamentoComponent } from './components/pagamento/pagamento';
import { User } from './components/user/user';
import { Sidebar } from './components/sidebar/sidebar';
import { AddressComponent } from './components/address/address';
import { Overview } from './components/overview/overview';
import { OrdersComponent } from './components/orders/orders';
import { OrderDetail } from './components/order-detail/order-detail';
import { AboutUs } from './components/about-us/about-us';
import { EmailValidationComponent } from './email-validation/email-validation';
import { ChangePasswordComponent } from './dialogs/change-password/change-password';
import { ResetPasswordComponent } from './components/reset-password/reset-password';
import { Wishlist } from './components/wishlist/wishlist';

@NgModule({
  // Tutti i componenti NON-standalone dichiarati in questo modulo
  declarations: [
    App,
    Login,
    Register,
    ProductDetails,
    HeaderComponent,
    Footer,
    HomeComponent,
    Admin,
    DeleteUser,
    EditProfile,
    ProductDialog,
    AddressDialog,
    DeleteAddress,
    PagamentoComponent,
    User,
    AddressComponent,
    Overview,
    OrdersComponent,
    OrderDetail,
    CarrelloComponent,
    AboutUs,
    EmailValidationComponent,
    ChangePasswordComponent,
    ResetPasswordComponent,
    Wishlist,
  ],
  imports: [
    BrowserModule,      // Essenziale per app browser: fornisce NgIf, NgFor e altri built-in
    CommonModule,       // NgIf, NgFor, AsyncPipe, ecc. (ridondante con BrowserModule ma esplicito)
    AppRoutingModule,   // Registra il Router con le rotte definite in app-routing-module.ts
    ReactiveFormsModule, // Abilita FormBuilder, FormGroup, FormControl nei componenti
    FormsModule,         // Abilita [(ngModel)] per il two-way binding nei template

    // --- Angular Material ---
    MatInputModule,           // <input matInput>
    MatFormFieldModule,       // <mat-form-field> (contenitore degli input Material)
    MatButtonModule,          // mat-button, mat-raised-button, mat-icon-button
    MatCardModule,            // <mat-card> per le schede prodotto
    MatToolbarModule,         // <mat-toolbar> per l'header
    MatIconModule,            // <mat-icon> per le icone Material
    MatSidenavModule,         // <mat-sidenav> per la sidebar utente
    MatProgressSpinnerModule, // <mat-spinner> per il loading
    MatProgressBarModule,     // <mat-progress-bar>
    MatBadgeModule,           // matBadge per i contatori su icone (carrello, wishlist)
    MatDialogModule,          // MatDialog service + <mat-dialog-content/actions>
    MatTableModule,           // <mat-table> per le tabelle admin
    MatSelectModule,          // <mat-select> per i dropdown
    MatPaginatorModule,       // <mat-paginator> per la paginazione

    // Nota: Sidebar e AdminSidebar sono componenti standalone (standalone: true),
    // perciò si importano direttamente qui invece di essere dichiarati in declarations.
    Sidebar,
    AdminSidebar,
  ],
  providers: [
    // Registra HttpClient usando la Fetch API (necessario per SSR/Angular Universal)
    provideHttpClient(withFetch()),

    // Ascolta errori globali non catturati nel browser (window.onerror, unhandledrejection)
    provideBrowserGlobalErrorListeners(),

    // SSR Hydration: Angular Universal renderizza l'HTML lato server, poi il browser
    // "reidrata" il DOM. withEventReplay() registra gli eventi utente intercettati
    // durante l'hydration e li riproduce una volta che l'app Angular è attiva.
    provideClientHydration(withEventReplay()),

    // Esplicito per storicità; con providedIn:'root' non sarebbe necessario qui
    AuthService,
  ],
  // Il componente da cui Angular parte per costruire l'albero dei componenti
  bootstrap: [App],
})
export class AppModule {}
