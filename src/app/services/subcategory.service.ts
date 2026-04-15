/**
 * SUBCATEGORY SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Recupera le sottocategorie del catalogo, sia per categoria che in blocco.
 *
 * Usato da:
 * - HeaderComponent: carica le sottocategorie per ogni categoria (menu dropdown)
 * - ProductDialog (admin): popola il select "sottocategoria" nel form prodotto
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

// Corrisponde al SubcategoryDTO del backend
export interface Subcategory {
  id: number;
  categoryId: number;     // FK alla categoria padre
  subcategoryName: string;
}

@Injectable({
  providedIn: 'root',
})
export class SubcategoryService {
  private apiUrl = 'http://localhost:8080/rest/subcategory';

  constructor(private http: HttpClient) {}

  /**
   * Filtra le sottocategorie per categoria padre.
   * Usato dall'Header: per ogni categoria caricata, recupera le sue sottocategorie.
   * HttpParams gestisce l'encoding del query param: /listByCategory?id={categoryId}
   */
  getSubcategoriesByCategory(categoryId: number): Observable<Subcategory[]> {
    const params = new HttpParams().set('id', categoryId);
    return this.http.get<Subcategory[]>(`${this.apiUrl}/listByCategory`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching subcategories:', error);
        return throwError(() => new Error('Failed to fetch subcategories'));
      })
    );
  }

  /** Recupera tutte le sottocategorie senza filtro (usato nel form admin prodotto) */
  getAllSubcategories(): Observable<Subcategory[]> {
    return this.http.get<Subcategory[]>(`${this.apiUrl}/list`).pipe(
      catchError(error => {
        console.error('Error fetching all subcategories:', error);
        return throwError(() => new Error('Failed to fetch subcategories'));
      })
    );
  }
}
