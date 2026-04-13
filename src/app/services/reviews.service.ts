import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Review {
  id?: number;
  productId: number;
  userName: string;
  rating: number;
  comment: string;
  date?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = 'http://localhost:8080/rest/reviews';

  constructor(private http: HttpClient) {}

  getByProduct(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/product/${productId}`);
  }

  create(req: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, req);
  }

  update(id: number, req: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, req);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`);
  }
}
