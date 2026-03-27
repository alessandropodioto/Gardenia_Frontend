import { Component } from '@angular/core';

// Definiamo la struttura di un prodotto nel carrello
interface CartItem {
  id: number;
  nome: string;
  info: string;
  prezzo: number;
  quantita: number;
  immagine: string;
}

@Component({
  selector: 'app-carrello',
  standalone: false,
  templateUrl: './carrello.html',
  styleUrls: ['./carrello.css']
})
export class CarrelloComponent {
  
  // Ecco la variabile 'items' che Angular non trovava!
  items: CartItem[] = [
    { id: 1, nome: 'Monstera Deliciosa', info: 'Vaso: 12cm', prezzo: 25.00, quantita: 1, immagine: 'https://via.placeholder.com/80' },
    { id: 2, nome: 'Ficus Lyrata', info: 'Vaso: 15cm', prezzo: 35.00, quantita: 1, immagine: 'https://via.placeholder.com/80' }
  ];

  sogliaSpedizione = 50.00;

  // Ecco la variabile 'subtotal'
  get subtotal(): number {
    return this.items.reduce((acc, item) => acc + (item.prezzo * item.quantita), 0);
  }

  get mancanoPerSpedizione(): number {
    const diff = this.sogliaSpedizione - this.subtotal;
    return diff > 0 ? diff : 0;
  }

  get percentualeSpedizione(): number {
    return Math.min((this.subtotal / this.sogliaSpedizione) * 100, 100);
  }

  // Ecco la funzione 'cambiaQuantita' per i bottoni + e -
  cambiaQuantita(item: CartItem, delta: number) {
    item.quantita += delta;
    if (item.quantita <= 0) {
      this.items = this.items.filter(i => i.id !== item.id);
    }
  }
}