import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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

// AGGIORNATA: Aggiunto userName perché serve al carrello
export interface LoginResponse {
  id: string;
  role: string;
  userName?: string; 
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/rest/user';
  private platformId = inject(PLATFORM_ID);
  
  private authState = new BehaviorSubject<any>(this.getUserData());

  constructor(private http: HttpClient) {}

  isLoggedIn(): boolean {
    return !!this.getUserData();
  }

  getAuthState(): Observable<any> {
    return this.authState.asObservable();
  }

  emitAuthState(userData: any): void {
    this.authState.next(userData);
  }

  /**
   * Login utente
   */
  login(loginData: LoginData): Observable<LoginResponse> {
    const endpoint = `${this.apiUrl}/login`;
    return this.http.post<LoginResponse>(endpoint, loginData).pipe(
      tap((response) => {
        // Se il server non rimanda lo userName, usiamo quello usato per il login
        if (!response.userName) {
          response.userName = loginData.userName;
        }
      }),
      catchError(this.handleError)
    );
  }

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
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user_data');
      localStorage.removeItem('username'); // Puliamo tutto
    }
    this.emitAuthState(null);
  }

  /**
   * SALVATAGGIO DATI: Qui risolviamo il problema del null
   */
  setUserData(userData: any): void {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Salviamo l'oggetto completo
      localStorage.setItem('user_data', JSON.stringify(userData));

      // 2. Salviamo la stringa semplice che il CartService cerca disperatamente
      const name = userData.userName || userData.username || userData.user;
      if (name) {
        localStorage.setItem('username', name);
      }
    }
    this.emitAuthState(userData);
  }

  getUserData(): any {
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Prova a leggere il messaggio d'errore dal backend se esiste
      const serverMsg = error.error?.msg || error.message;
      errorMessage = `Error Code: ${error.status}\nMessage: ${serverMsg}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}