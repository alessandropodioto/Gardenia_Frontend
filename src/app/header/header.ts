import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.css',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule,
    MatButtonModule,
    RouterLink,
    RouterLinkActive,
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  
  frasi: string[] = [
    'Spedizione gratuita sopra i 79€',
    'Consegna rapida in tutta Italia',
    'Reso facile entro 30 giorni',
    'Sconto 10% sul tuo primo ordine!'
  ];

  indiceCorrente: number = 0;
  private intervalId: any;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.indiceCorrente = (this.indiceCorrente + 1) % this.frasi.length;
      this.cdr.detectChanges();
    }, 4000); 
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
