import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

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
    id: number;
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

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/list`).pipe(
      catchError(error => {
        console.error('Error fetching products:', error);
        return throwError(() => new Error('Failed to fetch products'));
      })
    );
  }

  getProductById(id: number): Observable<Product> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<Product>(`${this.apiUrl}/findById`, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching product with id ${id}:`, error);
        return throwError(() => new Error('Failed to fetch product details'));
      })
    );
  }

  getProductsBySubcategory(subcategoryId: number): Observable<Product[]> {
    const params = new HttpParams().set('subcategoryId', subcategoryId.toString());
    return this.http.get<Product[]>(`${this.apiUrl}/findBySubcategory`, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching products for subcategory ${subcategoryId}:`, error);
        return throwError(() => new Error('Failed to fetch products by subcategory'));
      })
    );
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/create`, product).pipe(
      catchError(error => {
       
        console.error('IL VERO ERRORE DAL BACKEND È:', error.error); 
        
        return throwError(() => new Error('Failed to create product'));
      })
    );
  }

  update(product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/update`, product).pipe(
      catchError(error => {
        console.error('Error updating product:', error);
        return throwError(() => new Error('Failed to update product'));
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`).pipe(
      catchError(error => {
        console.error(`Error deleting product with id ${id}:`, error);
        return throwError(() => new Error('Failed to delete product'));
      })
    );
  }
  // Aggiungi questo metodo nel tuo ProductService
  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:8080/rest/image/delete/${imageId}`).pipe(
      catchError(error => {
        console.error(`Errore durante l'eliminazione dell'immagine ${imageId}:`, error);
        return throwError(() => new Error('Failed to delete image'));
      })
    );
  }
  /**
   * Metodo per caricare l'immagine.
   * Invia un FormData al backend con il file e l'ID del prodotto.
   */
  uploadProductImage(file: File, productId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId.toString());

    return this.http.post<any>(`${this.imageApiUrl}/upload`, formData).pipe(
      catchError(error => {
        console.error(`Errore durante il caricamento dell'immagine:`, error);
        return throwError(() => new Error('Caricamento immagine fallito'));
      })
    );
  }
}