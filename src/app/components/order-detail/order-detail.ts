/**
 * ORDER DETAIL COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Mostra il dettaglio completo di un singolo ordine (inclusi i prodotti acquistati).
 * Raggiunto da /user/orders/:id.
 *
 * CONCETTO — pipe con map + switchMap:
 * Invece di leggere i parametri una volta sola con route.snapshot.paramMap.get('id')
 * (che funziona solo alla prima navigazione), usiamo route.paramMap come Observable.
 * Questo permette di reagire ai cambiamenti dell'ID nell'URL senza ricaricare il componente.
 *
 * map(params => params.get('id')): trasforma l'oggetto ParamMap in stringa id
 * switchMap(id => http.get(...)): per ogni nuovo id annulla la chiamata HTTP precedente
 *                                 (se l'utente cambia pagina velocemente) e ne fa una nuova
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserorderService } from '../../services/userorder.service';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-order-detail',
  standalone: false,
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail implements OnInit {
  order = signal<any>(null);
  loading = signal<boolean>(true);

  constructor(
    private route: ActivatedRoute,      // Dà accesso ai parametri della rotta corrente
    private userOrderService: UserorderService
  ) {}

  ngOnInit(): void {
    // PIPELINE RxJS per leggere l'ID dall'URL e caricare l'ordine:
    //
    // route.paramMap → Observable<ParamMap> (emette ogni volta che i params cambiano)
    //   .pipe(
    //     map(params => params.get('id'))        → estrae la stringa "id" dai params
    //     switchMap(id => getById(+id))          → +id converte la stringa in numero
    //                                              switchMap cancella la chiamata precedente
    //                                              se arriva un nuovo id prima che finisca
    //   )
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => {
        if (id) {
          this.loading.set(true);
          return this.userOrderService.getById(+id); // +id = conversione stringa→numero
        }
        this.loading.set(false);
        return [null]; // Emette null se non c'è ID (caso edge)
      })
    ).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Errore caricamento dettagli', err);
        this.loading.set(false);
        this.order.set(null);
      }
    });
  }
}
