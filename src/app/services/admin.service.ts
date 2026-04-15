/**
 * ADMIN SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce le operazioni amministrative sugli utenti del sistema.
 * Usato esclusivamente dal componente Admin (protetto da AdminGuard).
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';

// Interfaccia per i dati utente visualizzati nella tabella admin
export interface User {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;     // "USER" o "ADMIN"
  userName: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminServices {
  // Stessa URL base di AuthService: entrambi gestiscono endpoint /rest/user
  private apiUrl = 'http://localhost:8080/rest/user';

  constructor(private http: HttpClient) {}

  /** Recupera la lista completa di tutti gli utenti registrati */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/list`).pipe(
      catchError(error => {
        console.error('Error fetching users:', error);
        return throwError(() => new Error('Failed to fetch users'));
      })
    );
  }

  /**
   * Elimina un utente tramite il suo userName (path param: /delete/{username}).
   * Nota: l'eliminazione è permanente (hard delete), non un soft delete come i prodotti.
   */
  deleteUser(username: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${username}`).pipe(
      catchError(error => {
        console.error('Error deleting user:', error);
        return throwError(() => new Error('Failed to delete user'));
      })
    );
  }
}
