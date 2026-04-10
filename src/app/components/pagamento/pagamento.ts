import { Component } from '@angular/core';

@Component({
  selector: 'app-pagamento',
  standalone: false,
  templateUrl: './pagamento.html',      
  styleUrls: ['./pagamento.css']        
})

// ... resto del codice ...
export class PagamentoComponent {
  
  // Metodo di pagamento selezionato di default
  metodoScelto: string = 'carta';

  // Dati finti per il riepilogo (in futuro arriveranno dal Carrello)
  subtotale: number = 60.00;
  costoSpedizione: number = 0; // Gratis

  get totale(): number {
    return this.subtotale + this.costoSpedizione;
  }

  impostaMetodo(metodo: string) {
    this.metodoScelto = metodo;
  }

  completaAcquisto() {
    alert(' Grazie per il tuo acquisto su Gardenia! Il tuo ordine è stato confermato.');
  }
}