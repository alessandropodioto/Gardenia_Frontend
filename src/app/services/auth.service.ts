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
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // TODO: Replace with your actual API endpoint
  private apiUrl = 'http://localhost:8080/rest/user';

  constructor(private http: HttpClient) {}

  /**
   * Login user with userName and password
   * @param loginData Login credentials
   * @returns Observable with authentication response
   */
  login(loginData: LoginData): Observable<AuthResponse> {
    // TODO: Replace with actual login endpoint
    const endpoint = `${this.apiUrl}/login`;

    return this.http.post<AuthResponse>(endpoint, loginData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Register new user with all required fields
   * @param registerData User registration data
   * @returns Observable with registration response
   */
  register(registerData: RegisterData): Observable<AuthResponse> {
    // TODO: Replace with actual register endpoint
    const endpoint = `${this.apiUrl}/register`;

    return this.http.post<AuthResponse>(endpoint, registerData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Clear authentication data
   */
  logout(): void {
    localStorage.removeItem('user_data');
  }

  /**
   * Store user data
   * @param userData User information
   */
  setUserData(userData: any): void {
    localStorage.setItem('user_data', JSON.stringify(userData));
  }

  /**
   * Get stored user data
   * @returns User data or null
   */
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
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
