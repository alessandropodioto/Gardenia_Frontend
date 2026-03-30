import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

export interface Subcategory {
  id: number,
  categoryId: number,
  subcategoryName: string
}

@Injectable({
  providedIn: 'root',
})
export class SubcategoryService {
  private apiUrl = 'http://localhost:8080/rest/subcategory';

  constructor(private http: HttpClient) {}

  getSubcategoriesByCategory(categoryId: number): Observable<Subcategory[]> {
    const params = new HttpParams().set('id', categoryId);

    return this.http.get<Subcategory[]>(`${this.apiUrl}/listByCategory`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching subcategories:', error);
        return throwError(() => new Error('Failed to fetch subcategories'));
      })
    );
  }
}
