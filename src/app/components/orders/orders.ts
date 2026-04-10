import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserorderService } from '../../services/userorder.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class OrdersComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  
  orders = signal<any[]>([]);
  loading = signal<boolean>(true);

  constructor(
    private userOrderService: UserorderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Carichiamo solo se siamo nel browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserOrders();
    }
  }

  loadUserOrders(): void {
    this.loading.set(true);

    const userDataRaw = localStorage.getItem('user_data');
    const simpleUser = localStorage.getItem('username');
    
    let userKey = null;

    if (userDataRaw) {
      const userData = JSON.parse(userDataRaw);
      // USIAMO userName perché il backend filtra per stringa, non per ID numerico
      userKey = userData.userName || userData.username; 
    } else {
      userKey = simpleUser;
    }

    if (userKey) {
      this.userOrderService.getOrdersByUser(userKey).subscribe({
        next: (data) => {
          console.log('Ordini recuperati per:', userKey, data);
          // Ordiniamo dal più recente al più vecchio
          const sortedOrders = data.sort((a: any, b: any) => b.id - a.id);
          this.orders.set(sortedOrders);
          this.loading.set(false);
        },
        error: (err) => {
          console.error("Errore caricamento ordini:", err);
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
      this.router.navigate(['/login']); 
    }
  }
}