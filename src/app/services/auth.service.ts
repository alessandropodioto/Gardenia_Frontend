/**
 * AUTH SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce login, registrazione, logout e lo stato di autenticazione globale.
 *
 * CONCETTO — Service con BehaviorSubject per lo stato globale:
 * Un Service in Angular è un singleton (una sola istanza condivisa da tutti i
 * componenti) usato per la logica di business e per condividere dati.
 * BehaviorSubject è un Observable speciale: ricorda l'ultimo valore emesso e lo
 * invia immediatamente a ogni nuovo subscriber. È ideale per stato globale come
 * "l'utente è loggato?" perché chi si iscrive tardi riceve comunque il valore
 * corrente (a differenza di un Subject normale).
 *
 * FLUSSO AUTENTICAZIONE:
 *   Login → setUserData() → salva in localStorage + emette su BehaviorSubject
 *   Logout → rimuove da localStorage + emette null su BehaviorSubject
 *   Header → si iscrive a getAuthState() e si aggiorna in tempo reale
 */

import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

// --- Interfacce TypeScript ---
// Definiscono la forma degli oggetti scambiati con il backend (DTO = Data Transfer Object)

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
  msg: string; // Il backend risponde con un messaggio testuale (es. "rest_created")
}

// La risposta del backend al login contiene id (=userName), ruolo e opzionalmente lo userName
export interface LoginResponse {
  id: string;       // Il campo "id" nel token JWT è in realtà lo userName dell'utente
  role: string;     // Es. "USER" o "ADMIN"
  userName?: string; // Aggiunto per compatibilità con il CartService che cerca questo campo
}

@Injectable({
  providedIn: 'root', // Singleton a livello di applicazione
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/rest/user';

  // PLATFORM_ID: token Angular che identifica la piattaforma corrente.
  // Usato con isPlatformBrowser() per proteggere accessi a localStorage
  // che non esistono lato server (SSR con Angular Universal).
  private platformId = inject(PLATFORM_ID);

  // BehaviorSubject inizializzato con i dati utente già presenti nel localStorage
  // (permette di "ricordare" la sessione tra refresh della pagina).
  // I componenti si iscrivono tramite getAuthState() per reagire ai cambiamenti.
  private authState = new BehaviorSubject<any>(this.getUserData());

  constructor(private http: HttpClient) {}

  /** Ritorna true se c'è un utente salvato in localStorage */
  isLoggedIn(): boolean {
    // !! converte qualsiasi valore in boolean: !!null = false, !!{...} = true
    return !!this.getUserData();
  }

  /**
   * Espone lo stato auth come Observable (sola lettura dall'esterno).
   * I componenti si iscrivono qui per reagire a login/logout senza polling.
   * Esempio nell'Header: this.authService.getAuthState().subscribe(userData => { ... })
   */
  getAuthState(): Observable<any> {
    return this.authState.asObservable();
  }

  /**
   * Emette un nuovo valore sullo stream auth (usato dopo login e all'avvio).
   * Tutti i subscriber (es. Header) ricevono il nuovo stato immediatamente.
   */
  emitAuthState(userData: any): void {
    this.authState.next(userData);
  }

  /**
   * Chiama l'API di login e, tramite l'operatore tap(), normalizza la risposta
   * aggiungendo lo userName se il backend non lo ha incluso.
   * tap() è un operatore RxJS che esegue side-effect senza modificare il flusso.
   */
  login(loginData: LoginData): Observable<LoginResponse> {
    const endpoint = `${this.apiUrl}/login`;
    return this.http.post<LoginResponse>(endpoint, loginData).pipe(
      tap((response) => {
        // Fallback: se il server non rimanda lo userName, usiamo quello del form
        if (!response.userName) {
          response.userName = loginData.userName;
        }
      }),
      catchError(this.handleError)
    );
  }

  /** Registra un nuovo utente. Il backend invia un'email di convalida. */
  register(registerData: RegisterData): Observable<AuthResponse> {
    const endpoint = `${this.apiUrl}/register`;
    return this.http.post<AuthResponse>(endpoint, registerData).pipe(
      catchError(this.handleError)
    );
  }

  /** Aggiorna email, telefono o password dell'utente loggato */
  updateUser(data: { userName: string; email?: string; phone?: string; password?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update`, data).pipe(
      catchError(this.handleError)
    );
  }

  /** Recupera il profilo completo dell'utente dal backend tramite il suo userName */
  getUserByUserName(userName: string): Observable<any> {
    // HttpParams costruisce i query param in modo sicuro: ?id=userName
    return this.http.get<any>(`${this.apiUrl}/findByUserName`, { params: { id: userName } }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Logout: rimuove i dati dal localStorage ed emette null sul BehaviorSubject.
   * Tutti i componenti iscritti a getAuthState() (es. Header) ricevono null
   * e si aggiornano di conseguenza (es. nascondendo il menu utente).
   */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user_data'); // Oggetto completo con id, role, userName
      localStorage.removeItem('username');  // Stringa semplice usata come fallback dal CartService
    }
    this.emitAuthState(null); // Notifica tutti i subscriber che l'utente è uscito
  }

  /**
   * Salva i dati utente dopo il login in due formati nel localStorage:
   * 1. 'user_data' → oggetto JSON completo (usato da AuthService, AdminGuard, ecc.)
   * 2. 'username'  → stringa semplice (usata come fallback da CartService)
   * Poi notifica il BehaviorSubject per aggiornare i componenti in ascolto.
   */
  setUserData(userData: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user_data', JSON.stringify(userData));

      // Il backend può restituire lo userName con case diverso; proviamo tutte le varianti
      const name = userData.userName || userData.username || userData.user;
      if (name) {
        localStorage.setItem('username', name);
      }
    }
    this.emitAuthState(userData); // Aggiorna Header e altri subscriber
  }

  /** Legge e deserializza i dati utente dal localStorage (null se non loggato) */
  getUserData(): any {
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    }
    return null; // Lato server non c'è localStorage
  }

  /**
   * Gestore errori centralizzato per le pipe RxJS.
   * Viene passato come callback a catchError() per uniformare la gestione degli errori HTTP.
   * throwError() crea un Observable che emette subito un errore (il subscriber entra nel
   * blocco "error:" invece di "next:").
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Errore lato client (es. problema di rete)
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Errore lato server: legge il messaggio dal body della risposta HTTP
      const serverMsg = error.error?.msg || error.message;
      errorMessage = `Error Code: ${error.status}\nMessage: ${serverMsg}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Convalida l'email dell'utente usando l'ID/token ricevuto dal link via email.
   * HttpParams costruisce i query parameter in modo sicuro: /emailValidate?id=...
   */
  validateEmail(id: string): Observable<any> {
    const params = new HttpParams().set('id', id);
    return this.http.get<any>(`${this.apiUrl}/emailValidate`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /** Richiede al backend di inviare l'email per il reset della password */
  requestPasswordReset(userName: string): Observable<any> {
    const params = new HttpParams().set('userName', userName);
    return this.http.get<any>(`${this.apiUrl}/requestResetPassword`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Invia la nuova password al backend. Il campo userName viene dal token nell'URL
   * (letto da ResetPasswordComponent tramite ActivatedRoute).
   */
  changePassword(req: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/changePassword`, req).pipe(
      catchError(this.handleError)
    );
  }
}
