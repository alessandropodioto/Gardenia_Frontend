import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';

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
import { Admin } from './components/admin/admin';
import { AdminSidebar } from './components/admin-sidebar/admin-sidebar';
import { DeleteUser } from './dialogs/delete-user/delete-user';
import { ProductDialog } from './dialogs/product-dialog/product-dialog';
import { AddressDialog } from './dialogs/address-dialog/address-dialog';
import { DeleteAddress } from './dialogs/delete-address/delete-address';
import { PagamentoComponent } from './components/pagamento/pagamento';
import { User } from './components/user/user';
import { Sidebar } from './components/sidebar/sidebar';
import { AddressComponent } from './components/address/address';
import { Overview } from './components/overview/overview';
import { Orders } from './components/orders/orders';
import { OrderDetail } from './components/order-detail/order-detail';
import { AboutUs } from './components/about-us/about-us';

@NgModule({
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
    ProductDialog,
    AddressDialog,
    DeleteAddress,
    PagamentoComponent,
    User,
    AddressComponent,
    Overview,
    Orders,
    OrderDetail,
    CarrelloComponent,
    AboutUs
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
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
    MatDialogModule,
    MatTableModule,
    MatSelectModule,
    MatPaginatorModule,
    Sidebar,
    AdminSidebar,
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
