/**
 * ADMIN COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Dashboard amministrativa con tre sezioni: Utenti, Prodotti, Ordini.
 * Accessibile solo agli utenti con ruolo ADMIN (protetta da AdminGuard).
 *
 * CONCETTI CHIAVE:
 *
 * 1. ChangeDetectionStrategy.OnPush
 *    Ottimizzazione delle performance: Angular riesegue la change detection
 *    per questo componente SOLO quando cambia un @Input, viene emesso un evento
 *    dal template, o si chiama esplicitamente cdr.markForCheck().
 *    Senza OnPush, Angular controlla ogni binding ad ogni evento globale.
 *
 * 2. destroy$ + takeUntil (pattern per evitare memory leak)
 *    Ogni Observable (HTTP, dialog...) vive finché qualcuno è iscritto.
 *    Se un componente viene distrutto senza cancellare le subscription, gli
 *    Observable continuano a girare in background (memory leak).
 *    Il pattern:
 *      private destroy$ = new Subject<void>();
 *      observable.pipe(takeUntil(this.destroy$)).subscribe(...)
 *    in ngOnDestroy:
 *      this.destroy$.next(); this.destroy$.complete();
 *    ... cancella automaticamente TUTTE le subscription quando il componente viene distrutto.
 *
 * 3. forkJoin()
 *    Operatore RxJS che accetta un array di Observable e restituisce un Observable
 *    che emette un array con i risultati di tutti, ma SOLO quando tutti sono completati.
 *    Usato qui per: caricare le immagini di un prodotto in parallelo invece che in sequenza.
 *    Esempio: forkJoin([http.post(img1), http.post(img2), http.post(img3)])
 *    → tutte e 3 le chiamate partono contemporaneamente; si procede solo quando finiscono tutte.
 */

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { AdminServices, User } from '../../services/admin.service';
import { ProductService, Product } from '../../services/product.service';
import { UserorderService, UserOrder } from '../../services/userorder.service';
import { DeleteUser } from '../../dialogs/delete-user/delete-user';
import { ProductDialog, ProductDialogData } from '../../dialogs/product-dialog/product-dialog';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  // OnPush: il componente si aggiorna solo quando si chiama cdr.markForCheck()
  // (lo facciamo esplicitamente dopo ogni operazione async)
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  users: User[] = [];
  products: Product[] = [];
  orders: UserOrder[] = [];
  error: string | null = null;

  // Sezione attiva nel pannello ('users' | 'products' | 'orders')
  activeView: string = 'users';

  // Mappa orderId → nuovo stato in selezione (buffer prima del salvataggio)
  pendingStatusChanges: { [orderId: number]: string } = {};

  // Subject usato per il pattern destroy$: emetterà un valore in ngOnDestroy
  // e tutti i pipe con takeUntil(this.destroy$) si cancelleranno automaticamente
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private adminService: AdminServices,
    private productService: ProductService,
    private userorderService: UserorderService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef // Necessario con OnPush per forzare il re-render
  ) {}

  ngOnInit(): void {
    // Verifica SSR-safe dell'autenticazione
    if (typeof window !== 'undefined') {
      const userData = this.authService.getUserData();
      this.isAdmin = userData && userData.role === 'ADMIN';

      // Carica subito gli utenti (la sezione di default)
      if (this.isAdmin) {
        this.loadUsers();
      }
    }
  }

  ngOnDestroy(): void {
    // Emette un valore e completa il Subject → tutti i takeUntil si triggerano
    // e cancellano le loro subscription
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cambia la sezione visualizzata e carica i dati relativi se non ancora caricati.
   * cdr.markForCheck() dice ad Angular "controlla questo componente al prossimo ciclo"
   * (necessario con ChangeDetectionStrategy.OnPush).
   */
  onViewChange(view: string | Event): void {
    const viewStr = typeof view === 'string' ? view : '';
    this.activeView = viewStr;
    this.error = null;

    if (viewStr === 'products') {
      this.loadProducts();
    } else if (viewStr === 'orders') {
      this.loadOrders();
    }
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIONE UTENTI
  // ══════════════════════════════════════════════════════════════════════════

  loadUsers(): void {
    this.error = null;
    this.adminService.getUsers()
      .pipe(takeUntil(this.destroy$)) // Si cancella quando il componente viene distrutto
      .subscribe({
        next: (users) => {
          this.users = users;
          this.cdr.markForCheck(); // OnPush: notifichiamo Angular che ci sono dati nuovi
        },
        error: (err) => {
          this.error = 'Error loading users';
          this.cdr.markForCheck();
          console.error('Error loading users:', err);
        }
      });
  }

  /** Apre il dialog di conferma eliminazione; elimina solo se l'utente conferma */
  openDeleteUserDialog(user: User): void {
    // MatDialog.open() istanzia il componente DeleteUser come modale.
    // "data" viene iniettato nel componente tramite @Inject(MAT_DIALOG_DATA).
    const dialogRef = this.dialog.open(DeleteUser, {
      width: '400px',
      data: {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          email: user.email,
        },
      },
    });

    // afterClosed() emette il valore passato a dialogRef.close() nel dialog
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) { // DeleteUser chiama dialogRef.close(true) solo se si conferma
          this.confirmDeleteUser(user.userName);
        }
      });
  }

  confirmDeleteUser(username: string): void {
    this.adminService.deleteUser(username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Rimozione ottimistica: filtra l'utente dalla lista locale senza riscaricare tutto
          this.users = this.users.filter(u => u.userName !== username);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error deleting user';
          this.cdr.markForCheck();
          console.error('Error deleting user:', err);
        }
      });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIONE PRODOTTI
  // ══════════════════════════════════════════════════════════════════════════

  loadProducts(): void {
    this.error = null;
    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error loading products';
          this.cdr.markForCheck();
          console.error('Error loading products:', err);
        }
      });
  }

  /** Apre il dialog di creazione prodotto e gestisce il salvataggio con immagini */
  openCreateProductDialog(): void {
    const dialogRef = this.dialog.open(ProductDialog, {
      width: '600px',
      data: { mode: 'create', product: null } as ProductDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (!result) return; // L'utente ha annullato

        const productToSave = result.productData;
        const urlsText = result.imageUrls; // Stringa con URL separati da newline

        // Prima creiamo il prodotto, poi (se ci sono URL) carichiamo le immagini
        this.productService.create(productToSave)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              if (urlsText && urlsText.trim() !== '' && response && response.id) {
                // Parsing: split per newline, trim degli spazi, rimuovi righe vuote
                const urlArray = urlsText.split('\n')
                  .map((u: string) => u.trim())
                  .filter((u: string) => u !== '');

                if (urlArray.length > 0) {
                  // forkJoin: lancia TUTTE le chiamate di upload in parallelo.
                  // Aspetta che TUTTE siano completate, poi ricarica la lista prodotti.
                  const uploadRequests = urlArray.map((url: string) =>
                    this.productService.createImageLink(url, response.id)
                  );
                  forkJoin(uploadRequests).pipe(takeUntil(this.destroy$)).subscribe({
                    next: () => this.loadProducts(),
                    error: (err) => {
                      // Alcune immagini potrebbero aver fallito; ricarichiamo comunque il prodotto
                      console.error('Errore salvataggio di alcune immagini', err);
                      this.loadProducts();
                    }
                  });
                } else {
                  this.loadProducts();
                }
              } else {
                this.loadProducts(); // Nessuna immagine: ricarica direttamente
              }
            },
            error: (err) => {
              this.error = 'Error creating product';
              this.cdr.markForCheck();
              console.error('Errore durante la creazione del prodotto:', err);
            }
          });
      });
  }

  /** Apre il dialog di modifica prodotto e gestisce l'aggiornamento con immagini */
  openEditProductDialog(product: Product): void {
    const dialogRef = this.dialog.open(ProductDialog, {
      width: '600px',
      data: { product: product, mode: 'edit' } as ProductDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (!result) return;

        const productToUpdate = result.productData;
        const urlsText = result.imageUrls;
        const imageIdsToDelete: number[] = result.deletedImageIds || [];

        // Se ci sono nuove immagini E vecchie immagini da rimuovere:
        // prima eliminiamo quelle vecchie (forkJoin in parallelo), poi aggiorniamo
        if (urlsText && urlsText.trim() !== '' && imageIdsToDelete.length > 0) {
          const deleteRequests = imageIdsToDelete.map(id => this.productService.deleteImage(id));
          forkJoin(deleteRequests).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this.updateProduct(productToUpdate, urlsText),
            error: () => this.updateProduct(productToUpdate, urlsText) // Procede anche se alcune delete falliscono
          });
        } else {
          this.updateProduct(productToUpdate, urlsText);
        }
      });
  }

  /** Salva le modifiche al prodotto e opzionalmente carica le nuove immagini */
  updateProduct(product: Product, urlsText: string | null = null): void {
    this.productService.update(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_updatedProduct: any) => { // _ = variabile intenzionalmente non usata
          if (urlsText && urlsText.trim() !== '' && product && product.id) {
            const urlArray = urlsText.split('\n')
              .map((u: string) => u.trim())
              .filter((u: string) => u !== '');

            if (urlArray.length > 0) {
              // Upload parallelo delle nuove immagini con forkJoin
              const uploadRequests = urlArray.map((url: string) =>
                this.productService.createImageLink(url, product.id)
              );
              forkJoin(uploadRequests).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadProducts());
            } else {
              this.loadProducts();
            }
          } else {
            this.loadProducts();
          }
        },
        error: (err) => {
          this.error = 'Error updating product';
          this.cdr.markForCheck();
          console.error('Error updating product:', err);
        }
      });
  }

  /**
   * Riusa il dialog DeleteUser anche per i prodotti (lo stesso layout di conferma).
   * I campi user.firstName/lastName vengono usati come label generiche nel template.
   */
  openDeleteProductDialog(product: Product): void {
    const confirmDialog = this.dialog.open(DeleteUser, {
      width: '400px',
      data: {
        user: {
          firstName: 'Product',
          lastName: product.name,
          userName: product.id.toString(),
          email: '',
        },
      },
    });

    confirmDialog.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.deleteProduct(product); // passa il prodotto intero, serve al service
        }
      });
  }

  deleteProduct(product: Product): void {
    this.productService.softDelete(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Rimozione ottimistica dalla lista locale
          this.products = this.products.filter(p => p.id !== product.id);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error deleting product';
          this.cdr.markForCheck();
          console.error('Error deleting product:', err);
        }
      });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIONE ORDINI
  // ══════════════════════════════════════════════════════════════════════════

  loadOrders(): void {
    this.error = null;
    this.userorderService.list()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.orders = orders;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error loading orders';
          this.cdr.markForCheck();
          console.error('Error loading orders:', err);
        }
      });
  }

  /** Salva il nuovo stato di un ordine selezionato dal dropdown */
  updateOrderStatus(order: UserOrder): void {
    const newStatus = this.pendingStatusChanges[order.id!];
    if (!newStatus) return; // Nessun cambio in attesa per questo ordine

    const updatedOrder = { ...order, status: newStatus }; // Spread: copia l'ordine e aggiorna lo stato

    this.userorderService.update(updatedOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Aggiorna la lista locale senza ricaricare tutto dal backend
          const index = this.orders.findIndex(o => o.id === order.id);
          if (index !== -1) {
            this.orders[index].statusDescription = newStatus;
            delete this.pendingStatusChanges[order.id!]; // Rimuove il cambio pendente
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.error = 'Error updating order status';
          this.cdr.markForCheck();
          console.error('Error updating order status:', err);
        }
      });
  }

  /**
   * Chiamato dal <mat-select> ad ogni cambio: salva il nuovo stato nel buffer
   * senza inviarlo subito al backend (l'utente deve cliccare "Salva").
   */
  onStatusChange(orderId: number, newStatus: string): void {
    this.pendingStatusChanges[orderId] = newStatus;
    this.cdr.markForCheck();
  }
}
