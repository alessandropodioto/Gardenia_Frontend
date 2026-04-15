/**
 * CATEGORY SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Recupera le categorie del catalogo prodotti dal backend.
 * Usato dall'Header per costruire il menu di navigazione principale.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

// Corrisponde al CategoryDTO del backend
export interface Category {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:8080/rest/category';

  constructor(private http: HttpClient) {}

  /** Recupera tutte le categorie attive (usato da HeaderComponent all'avvio) */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/list`).pipe(
      catchError(error => {
        console.error('Error fetching categories:', error);
        return throwError(() => new Error('Failed to fetch categories'));
      })
    );
  }
}
