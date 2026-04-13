import { Component, signal } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { UserorderService } from '../../services/userorder.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pagamento',
  standalone: false,
  templateUrl: './pagamento.html',
  styleUrls: ['./pagamento.css']
})
export class PagamentoComponent {
  
  // Stato caricamento e notifiche
  loading = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  
  // Gestione costi
  shippingCost = signal(0); // Impostato a 0 per spedizione gratuita
  metodoScelto: string = 'carta';

  constructor(
    public cartService: CartService,
    private userOrderService: UserorderService,
    private router: Router
  ) {}

  // Recupera gli articoli reali dal carrello
  get items() {
    return this.cartService.cartItems();
  }

  get subtotale(): number {
    return this.items.reduce((acc, item) => acc + item.price * item.amount, 0);
  }

  get totale(): number {
    return this.subtotale + this.shippingCost();
  }

  impostaMetodo(metodo: string) {
    this.metodoScelto = metodo;
  }

  completaAcquisto() {
    if (this.items.length === 0) return;
    
    this.loading.set(true);
    let userIdentifier: string | null = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        userIdentifier = parsed.userName || parsed.username;
      }
      if (!userIdentifier) userIdentifier = localStorage.getItem('username');
    }

    if (!userIdentifier) {
      this.notify('Please log in to confirm the order.');
      this.loading.set(false);
      return;
    }

    const ordineDaInviare = {
      userId: userIdentifier,
      wharehouse: 'Main',
      isPaid: true,
      statusDescription: 'PAID',
      date: new Date().toISOString().split('T')[0],
      totalPrice: this.totale,
    };

    this.userOrderService.create(ordineDaInviare).subscribe({
      next: () => {
        this.cartService.resetCartSignal();
        this.loading.set(false);
        this.notify('Order confirmed! Redirecting...');
        setTimeout(() => this.router.navigate(['/user/orders']), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify('Error during payment. Please try again.');
        console.error('Order failed:', err);
      }
    });
  }

  private notify(msg: string) {
    this.toastMessage.set(msg);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}