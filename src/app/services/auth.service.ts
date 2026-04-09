import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
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
  
  // Inizializziamo authState con i dati presenti nel localStorage (se esistono)
  private authState = new BehaviorSubject<any>(this.getUserData());

  constructor(private http: HttpClient) {}

  /**
   * Controlla se l'utente è loggato (usato nel template HTML e TS)
   */
  isLoggedIn(): boolean {
    return !!this.getUserData();
  }

  /**
   * Ritorna lo stato di autenticazione come Observable
   */
  getAuthState(): Observable<any> {
    return this.authState.asObservable();
  }

  /**
   * Emette un cambiamento nello stato di autenticazione
   */
  emitAuthState(userData: any): void {
    this.authState.next(userData);
  }

  /**
   * Login utente
   */
  login(loginData: LoginData): Observable<LoginResponse> {
    const endpoint = `${this.apiUrl}/login`;
    return this.http.post<LoginResponse>(endpoint, loginData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Registrazione nuovo utente
   */
  register(registerData: RegisterData): Observable<AuthResponse> {
    const endpoint = `${this.apiUrl}/register`;
    return this.http.post<AuthResponse>(endpoint, registerData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Aggiorna i dati dell'utente (email, phone, password)
   */
  updateUser(data: { userName: string; email?: string; phone?: string; password?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Recupera i dati completi dell'utente dal backend
   */
  getUserByUserName(userName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/findByUserName`, { params: { id: userName } }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Logout: cancella i dati e notifica lo stato null
   */
  logout(): void {
    localStorage.removeItem('user_data');
    this.emitAuthState(null);
  }

  /**
   * Salva i dati utente nel localStorage e aggiorna lo stato
   */
  setUserData(userData: any): void {
    localStorage.setItem('user_data', JSON.stringify(userData));
    this.emitAuthState(userData);
  }

  /**
   * Recupera i dati dal localStorage
   */
  getUserData(): any {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  /**
   * Gestione errori HTTP
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