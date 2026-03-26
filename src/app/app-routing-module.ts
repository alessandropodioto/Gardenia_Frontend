import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductDetails } from './components/product-details/product-details';
import { HomeComponent } from './components/home/home';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { CarrelloComponent } from './components/carrello/carrello';
import { PagamentoComponent } from './components/pagamento/pagamento';
import { User } from './components/user/user';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'product' , component:ProductDetails },
  { path: 'cart', component: CarrelloComponent },
  { path: 'home', component: HomeComponent },
   { path: 'user', component: User },
 { path: 'pagamento', component: PagamentoComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
