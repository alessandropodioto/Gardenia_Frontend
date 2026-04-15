/**
 * REVIEW SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce le operazioni CRUD sulle recensioni dei prodotti.
 * Usato esclusivamente da ProductDetails.
 *
 * A differenza degli altri servizi, qui non viene usato catchError: errori
 * vengono gestiti localmente nel componente che chiama i metodi.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaccia per la recensione (allineata al ReviewDTO del backend)
export interface Review {
  id?: number;          // Assente nella creazione, presente nelle risposte
  productId: number;
  userName: string;
  rating: number;       // Valore 1-5
  comment: string;
  date?: string;        // Aggiunto dal backend al momento della creazione
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = 'http://localhost:8080/rest/reviews';

  constructor(private http: HttpClient) {}

  /** Recupera tutte le recensioni di un prodotto specifico */
  getByProduct(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/product/${productId}`);
  }

  /** Crea una nuova recensione. Il backend risponde con { msg: "rest_created" } */
  create(req: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, req);
  }

  /** Aggiorna una recensione esistente (solo l'autore può modificarla) */
  update(id: number, req: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, req);
  }

  /** Elimina una recensione per ID */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`);
  }
}
