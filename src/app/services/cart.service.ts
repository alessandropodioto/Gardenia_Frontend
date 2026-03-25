import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Sostituisci con la porta su cui gira il tuo Spring Boot
  private apiUrl = 'http://localhost:8080/api/shopping-cart'; 

  constructor(private http: HttpClient) {}

  // Esempio: recupera il carrello di un utente
  getCart(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`);
  }

  // Esempio: aggiungi un prodotto
  addToCart(productId: number, quantity: number): Observable<any> {
    const payload = { productId, quantity };
    return this.http.post(`${this.apiUrl}/add`, payload);
  }
}