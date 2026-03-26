import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface RegisterData {
  userName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}

export interface LoginData {
  userName: string;
  password: string;
}

export interface AuthResponse {
  msg: string;
}

export interface LoginResponse {
  id: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/rest/user';

  constructor(private http: HttpClient) {}

  /**
   * Login user with userName and password
   * @param loginData Login credentials
   * @returns Observable with authentication response
   */
  login(loginData: LoginData): Observable<LoginResponse> {
    const endpoint = `${this.apiUrl}/login`;

    return this.http.post<LoginResponse>(endpoint, loginData).pipe(catchError(this.handleError));
  }

  /**
   * Register new user with all required fields
   * @param registerData User registration data
   * @returns Observable with registration response
   */
  register(registerData: RegisterData): Observable<AuthResponse> {
    const endpoint = `${this.apiUrl}/register`;

    return this.http.post<AuthResponse>(endpoint, registerData).pipe(catchError(this.handleError));
  }

  logout(): void {
    localStorage.removeItem('user_data');
  }

  setUserData(userData: any): void {
    localStorage.setItem('user_data', JSON.stringify(userData));
  }

  getUserData(): any {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Handle HTTP errors
   * @param error Error response
   * @returns Observable with error message
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
