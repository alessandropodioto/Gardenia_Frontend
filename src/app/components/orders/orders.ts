import { Component, OnInit, signal, inject, PLATFORM_ID, HostListener } from '@angular/core';
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
  
  // Dati e caricamento
  orders = signal<any[]>([]);
  loading = signal<boolean>(true);
  
  // Gestione "View More"
  visibleCount = signal<number>(4);

  // Gestione "Back to Top"
  showScrollButton = false;

  constructor(
    private userOrderService: UserorderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserOrders();
    }
  }

  // Monitora lo scroll per mostrare/nascondere la freccia
  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      // Mostra il tasto se l'utente scende più di 400 pixel
      this.showScrollButton = window.scrollY > 400;
    }
  }

  // Torna in cima alla pagina con effetto fluido
  scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  // Mostra altri 4 ordini al clic
  showMore(): void {
    this.visibleCount.update(count => count + 4);
  }

  loadUserOrders(): void {
    this.loading.set(true);

    const userDataRaw = localStorage.getItem('user_data');
    const simpleUser = localStorage.getItem('username');
    
    let userKey = null;

    if (userDataRaw) {
      const userData = JSON.parse(userDataRaw);
      userKey = userData.userName || userData.username; 
    } else {
      userKey = simpleUser;
    }

    if (userKey) {
      this.userOrderService.getOrdersByUser(userKey).subscribe({
        next: (data) => {
          // Ordiniamo dal più recente al più vecchio (ID decrescente)
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