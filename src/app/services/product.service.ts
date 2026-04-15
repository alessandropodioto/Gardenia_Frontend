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


  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/list`).pipe(
      catchError(this.handleError('getProducts'))
    );
  }


  getProductById(id: number): Observable<Product> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<Product>(`${this.apiUrl}/findById`, { params }).pipe(
      catchError(this.handleError(`getProductById id=${id}`))
    );
  }

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

  
  softDelete(product: Product): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/softDelete`, product).pipe(
      catchError(this.handleError('softDeleteProduct'))
    );
  }


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


  private handleError(operation = 'operation') {
    return (error: any): Observable<never> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => new Error(`${operation} failed`));
    };
  }
}
