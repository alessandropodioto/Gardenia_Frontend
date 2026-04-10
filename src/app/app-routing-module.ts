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

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'category/:categoryName/:subcategoryName', component: HomeComponent },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'product/:id', component: ProductDetails },
  { path: 'cart', component: CarrelloComponent },
  { path: 'admin', component: Admin, canActivate: [AdminGuard] },
  { path: 'pagamento', component: PagamentoComponent },
  { path: 'about-us', component: AboutUs },
  {
    path: 'user',
    component: User,
    children: [
      { path: 'overview', component: Overview },
      { path: 'address', component: Address },
      { path: 'orders', component: OrdersComponent },
      { path: 'address', component: AddressComponent },
      { path: 'orders', component: Orders },
      { path: 'orders/:id', component: OrderDetail },
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
