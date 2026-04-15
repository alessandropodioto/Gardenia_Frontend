/**
 * ORDERS COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Lista degli ordini dell'utente con paginazione "show more" e pulsante "back to top".
 *
 * CONCETTI:
 * - signal() per lista ordini e contatore visibile
 * - @HostListener per ascoltare lo scroll globale della pagina
 * - isPlatformBrowser() per proteggere accessi a window (SSR-safe)
 * - inject(PLATFORM_ID) come alternativa al costruttore per ottenere il token
 */

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
  // inject() è un'alternativa moderna al costruttore per l'Dependency Injection
  // (funziona fuori dal costruttore, es. nelle proprietà di classe)
  private platformId = inject(PLATFORM_ID);

  orders = signal<any[]>([]);         // Lista completa degli ordini
  loading = signal<boolean>(true);

  // Paginazione "show more": quanti ordini visualizzare (si incrementa con "Mostra altri")
  visibleCount = signal<number>(4);

  // Visibilità del pulsante "Torna in cima" (appare dopo 400px di scroll)
  showScrollButton = false;

  constructor(
    private userOrderService: UserorderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Carichiamo gli ordini solo nel browser (localStorage non disponibile lato server)
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserOrders();
    }
  }

  /**
   * @HostListener('window:scroll'): Angular registra questo metodo come listener
   * sull'evento "scroll" del window. Viene chiamato ad ogni scroll dell'utente.
   * ['$event'] non è necessario qui (non usiamo l'evento), ma è la sintassi standard.
   */
  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      // window.scrollY = pixel scrollati dall'inizio della pagina
      this.showScrollButton = window.scrollY > 400;
    }
  }

  /** Scorre fluido verso la cima della pagina */
  scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Aumenta il numero di ordini visibili di 4 (lazy loading simulato lato client) */
  showMore(): void {
    // .update() modifica il valore del signal applicando una funzione al valore corrente
    this.visibleCount.update(count => count + 4);
  }

  /** Carica gli ordini dell'utente corrente dal backend, ordinati dal più recente */
  loadUserOrders(): void {
    this.loading.set(true);

    // Recupero username con fallback (stesso pattern di CartService)
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
          // Ordina per id decrescente: il backend non garantisce l'ordine,
          // quindi ordenamos in frontend (id più alto = ordine più recente)
          const sortedOrders = data.sort((a: any, b: any) => b.id - a.id);
          this.orders.set(sortedOrders);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Errore caricamento ordini:', err);
          this.loading.set(false);
        }
      });
    } else {
      // Nessuno username trovato: l'utente non è loggato
      this.loading.set(false);
      this.router.navigate(['/login']);
    }
  }
}
