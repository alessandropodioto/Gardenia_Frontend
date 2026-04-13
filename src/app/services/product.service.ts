import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
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
  isDeleted: boolean;
  images?: {
    imageId: number;
    link: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/rest/product';
  private imageApiUrl = 'http://localhost:8080/rest/image';

  constructor(private http: HttpClient) {}

  // --- GESTIONE PRODOTTI ---

  /**
   * Recupera tutti i prodotti attivi
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/list`).pipe(
      catchError(this.handleError('getProducts'))
    );
  }

  /**
   * Trova un prodotto per ID tramite Query Param (?id=...)
   */
  getProductById(id: number): Observable<Product> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<Product>(`${this.apiUrl}/findById`, { params }).pipe(
      catchError(this.handleError(`getProductById id=${id}`))
    );
  }

  /**
   * Filtra i prodotti per sottocategoria tramite Query Param (?subcategoryId=...)
   */
  getProductsBySubcategory(subcategoryId: number): Observable<Product[]> {
    const params = new HttpParams().set('subcategoryId', subcategoryId.toString());
    return this.http.get<Product[]>(`${this.apiUrl}/findBySubcategory`, { params }).pipe(
      catchError(this.handleError('getProductsBySubcategory'))
    );
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/create`, product).pipe(
      catchError(this.handleError('createProduct'))
    );
  }

  update(product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/update`, product).pipe(
      catchError(this.handleError('updateProduct'))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`).pipe(
      catchError(this.handleError('deleteProduct'))
    );
  }

  // --- GESTIONE IMMAGINI ---

  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.imageApiUrl}/delete/${imageId}`).pipe(
      catchError(this.handleError('deleteImage'))
    );
  }

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
   * Gestore errori centralizzato per il service
   */
  private handleError(operation = 'operation') {
    return (error: any): Observable<never> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => new Error(`${operation} failed`));
    };
  }
}