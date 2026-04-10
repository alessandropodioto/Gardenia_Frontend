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
    private route: ActivatedRoute,
    private userOrderService: UserorderService
  ) {}

  ngOnInit(): void {
    // Usiamo params.pipe per gestire il cambio di ID in tempo reale
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => {
        if (id) {
          this.loading.set(true);
          return this.userOrderService.getById(+id);
        }
        this.loading.set(false);
        return [null]; // Ritorna un array con null se non c'è ID
      })
    ).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error("Errore caricamento dettagli", err);
        this.loading.set(false);
        this.order.set(null);
      }
    });
  }
}