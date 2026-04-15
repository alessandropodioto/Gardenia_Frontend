/**
 * PRODUCT SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce tutte le chiamate HTTP per i prodotti e le immagini associate.
 * Usato sia dai componenti pubblici (Home, ProductDetails) che dall'Admin.
 *
 * PATTERN — handleError factory:
 * Invece di ripetere il codice di gestione errori in ogni metodo, si usa una
 * funzione factory privata che accetta il nome dell'operazione e restituisce
 * un handler catchError. Il parametro "operation" permette di identificare
 * nei log quale chiamata API ha fallito.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

// Interfaccia allineata al ProductDTO del Backend
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  subcategoryId: number;
  subcategoryName: string;
  isDeleted: boolean;     // Soft delete: il prodotto non viene eliminato dal DB ma marcato
  images?: {
    imageId: number;
    link: string;         // URL assoluto oppure nome file (gestito da getImageUrl nei componenti)
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/rest/product';
  private imageApiUrl = 'http://localhost:8080/rest/image';

  constructor(private http: HttpClient) {}

  // ─── GESTIONE PRODOTTI ───────────────────────────────────────────────────

  /** Recupera tutti i prodotti attivi (isDeleted = false) */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/list`).pipe(
      catchError(this.handleError('getProducts'))
    );
  }

  /**
   * Trova un prodotto per ID tramite query param (?id=X).
   * HttpParams costruisce i parametri in modo sicuro (gestisce encoding speciali).
   */
  getProductById(id: number): Observable<Product> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<Product>(`${this.apiUrl}/findById`, { params }).pipe(
      catchError(this.handleError(`getProductById id=${id}`))
    );
  }

  /** Filtra i prodotti per sottocategoria (usato da Home e da loadSuggestedProducts) */
  getProductsBySubcategory(subcategoryId: number): Observable<Product[]> {
    const params = new HttpParams().set('subcategoryId', subcategoryId.toString());
    return this.http.get<Product[]>(`${this.apiUrl}/findBySubcategory`, { params }).pipe(
      catchError(this.handleError('getProductsBySubcategory'))
    );
  }

  /** Crea un nuovo prodotto (solo admin) */
  create(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/create`, product).pipe(
      catchError(this.handleError('createProduct'))
    );
  }

  /** Aggiorna un prodotto esistente (l'id è incluso nell'oggetto) */
  update(product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/update`, product).pipe(
      catchError(this.handleError('updateProduct'))
    );
  }

  /** Esegue il soft delete del prodotto: PUT /rest/product/softDeleted con il prodotto nel body → il BE imposta isDeleted = true */
  softDelete(product: Product): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/softDelete`, product).pipe(
      catchError(this.handleError('softDeleteProduct'))
    );
  }

  // ─── GESTIONE IMMAGINI ───────────────────────────────────────────────────

  /** Elimina un'immagine per ID (usato in admin prima di aggiungere nuove immagini) */
  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.imageApiUrl}/delete/${imageId}`).pipe(
      catchError(this.handleError('deleteImage'))
    );
  }

  /**
   * Associa un link immagine a un prodotto.
   * Il backend salva il link e lo restituisce con il suo imageId nelle chiamate successive.
   */
  createImageLink(linkStr: string, productIdNum: number): Observable<any> {
    const payload = {
      link: linkStr,
      productId: productIdNum
    };
    return this.http.post<any>(`${this.imageApiUrl}/create`, payload).pipe(
      catchError(this.handleError('createImageLink'))
    );
  }

  /**
   * PATTERN FACTORY per gestione errori:
   * Restituisce una funzione handler da usare in catchError().
   * Il parametro "operation" viene incluso nel messaggio di log per facilitare
   * il debug (es. "getProducts failed" invece di un generico "error").
   */
  private handleError(operation = 'operation') {
    return (error: any): Observable<never> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => new Error(`${operation} failed`));
    };
  }
}
