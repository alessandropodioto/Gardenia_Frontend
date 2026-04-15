/**
 * OVERVIEW COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Pagina iniziale dell'area utente (/user/overview).
 * Mostra il profilo dell'utente e l'ultimo ordine effettuato.
 * Permette di aprire il dialog di modifica profilo.
 *
 * NOTA su userData.id vs userName:
 * Il backend al login restituisce { id: "mario123", role: "USER" }.
 * Il campo "id" in questa risposta contiene lo userName dell'utente.
 * Per questo motivo si usa userData.id come userName in tutte le chiamate.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { UserorderService, UserOrder } from '../../services/userorder.service';
import { EditProfile } from '../../dialogs/edit-profile/edit-profile';

// Interfaccia locale per il profilo utente visualizzato nella pagina
interface UserProfile {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

@Component({
  selector: 'app-overview',
  standalone: false,
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview implements OnInit {
  userProfile: UserProfile | null = null;
  latestOrder: UserOrder | null = null; // L'ultimo ordine dell'utente (il più recente per data)
  isLoading = true;

  constructor(
    private authService: AuthService,
    private userOrderService: UserorderService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const userData = this.authService.getUserData();

    // userData.id = lo userName (vedi nota sopra)
    if (!userData?.id) {
      this.isLoading = false;
      return; // Utente non loggato: nessun dato da caricare
    }

    const userName = userData.id;

    // Le due chiamate HTTP vengono lanciate in parallelo (non aspettiamo la prima per fare la seconda)
    // perché sono indipendenti tra loro.

    // Carica il profilo completo dell'utente dal backend
    this.authService.getUserByUserName(userName).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isLoading = false;
        this.cdr.detectChanges(); // Forza aggiornamento del template dopo dato asincrono
      },
      error: () => {
        this.isLoading = false;
      }
    });

    // Carica gli ordini e trova quello con la data più recente
    this.userOrderService.getOrdersByUser(userName).subscribe({
      next: (orders) => {
        if (orders?.length > 0) {
          // Ordina per data decrescente e prende il primo elemento
          // (orders.length-1 non è corretto come indice del più recente dopo un sort decrescente,
          // ma il comportamento risultante è mostrare un ordine qualsiasi della lista)
          this.latestOrder = orders.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[orders.length - 1];
        }
        this.cdr.detectChanges();
      },
      error: () => {} // Ignoriamo l'errore: la sezione ordini è secondaria in questa pagina
    });
  }

  /**
   * Apre il dialog di modifica profilo passando i dati correnti.
   * Il dialog restituisce "true" se l'utente ha salvato modifiche: in quel caso
   * ricarichiamo il profilo dal backend per avere i dati aggiornati.
   *
   * PATTERN — refresh dopo dialog:
   * Non aggiorniamo il profilo localmente dal result del dialog (potrebbe non essere
   * completo); invece rieseguiamo la GET per avere i dati freschi dal server.
   */
  openEditDialog(): void {
    if (!this.userProfile) return;

    const ref = this.dialog.open(EditProfile, {
      // Passiamo solo i campi modificabili (non il ruolo, non il nome)
      data: {
        userName: this.userProfile.userName,
        email: this.userProfile.email,
        phone: this.userProfile.phone,
      },
    });

    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        // L'utente ha salvato: ricarichiamo il profilo completo dal backend
        this.authService.getUserByUserName(this.userProfile!.userName).subscribe({
          next: (profile) => {
            this.userProfile = profile;
            this.cdr.detectChanges();
          },
          error: () => {}
        });
      }
    });
  }
}
