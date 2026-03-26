import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

import { AppRoutingModule } from './app-routing-module';

import { App } from './app';
import { ProductDetails } from './components/product-details/product-details';
import { HeaderComponent } from './components/header/header';
import { Footer } from './components/footer/footer';
import { HomeComponent } from './components/home/home';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { AuthService } from './services/auth.service';
import { CarrelloComponent } from './components/carrello/carrello';
import { PagamentoComponent } from './components/pagamento/pagamento';
import { User } from './components/user/user';
import { Sidebar } from './components/sidebar/sidebar';
import { Address } from './components/address/address';
import { Overview } from './components/overview/overview';
import { Orders } from './components/orders/orders';
import { OrderDetail } from './components/order-detail/order-detail';

@NgModule({
  declarations: [
    App,
    Login,
    Register,
    CarrelloComponent,
    ProductDetails,
    HeaderComponent,
    Footer,
    HomeComponent,
    PagamentoComponent,
    User,
    Address,
    Overview,
    Orders,
    OrderDetail,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatBadgeModule,
    Sidebar,
  ],
  providers: [
    provideHttpClient(withFetch()),
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    AuthService,
  ],
  bootstrap: [App],
})
export class AppModule {}
