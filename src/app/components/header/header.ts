/**
 * HEADER COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente persistente caricato una volta sola (dichiarato in app.html).
 * Gestisce: banner rotante, menu categorie/dropdown, stato login/admin, badge carrello e wishlist.
 *
 * CONCETTI USATI:
 * - OnInit / OnDestroy: lifecycle hooks per inizializzare e pulire risorse
 * - Subscription RxJS: reference all'iscrizione per poterla cancellare in OnDestroy
 * - ChangeDetectorRef: forza la rilevazione cambiamenti (necessario con setInterval)
 * - @HostListener: intercetta eventi globali del DOM (click fuori dal menu)
 */

import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { SubcategoryService, Subcategory } from '../../services/subcategory.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.css',
  standalone: false, // Appartiene ad AppModule (non è standalone)
})
export class HeaderComponent implements OnInit, OnDestroy {

  // Frasi del banner promozionale che ruotano ogni 4 secondi
  phrases: string[] = [
    'Free shipping on orders over €79',
    'Fast delivery throughout Italy',
    'Easy returns within 30 days',
    '10% discount on your first order!'
  ];

  currentIndex: number = 0;         // Indice della frase attualmente visibile
  private intervalId: any;          // ID del setInterval (serve per fermarlo in OnDestroy)

  // Subscription: riferimento all'iscrizione al BehaviorSubject di AuthService.
  // Va cancellata in ngOnDestroy per evitare memory leak (l'Header vive per tutta l'app,
  // ma è buona pratica cancellare sempre le subscription).
  private authSubscription: Subscription | null = null;

  isAdmin: boolean = false;
  isLoggedIn: boolean = false;

  activeMenu: string | null = null;  // Nome del menu dropdown attualmente aperto (null = tutti chiusi)
  categories: any[] = [];

  // Mappa categoryId → lista sottocategorie: permette al template di accedere
  // alle sottocategorie di una categoria con subcategoriesMap[category.id]
  subcategoriesMap: { [categoryId: number]: Subcategory[] } = {};

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private categoryService: CategoryService,
    private subcategoryService: SubcategoryService,
    private router: Router,
    public cartService: CartService,        // "public" → accessibile nel template per cartCount()
    public wishlistService: WishlistService // "public" → accessibile nel template per wishlistCount()
  ) {}

  ngOnInit(): void {
    // ── Banner rotante ──────────────────────────────────────────────────────
    // setInterval esegue la callback ogni 4000ms. cdr.detectChanges() forza Angular
    // a rivalutare il template (necessario perché setInterval è fuori dalla zona Angular).
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.phrases.length;
      this.cdr.detectChanges();
    }, 4000);

    // ── Stato autenticazione iniziale ───────────────────────────────────────
    // Controlliamo subito i dati già in localStorage per non aspettare il primo evento.
    // "typeof window !== 'undefined'" = SSR-safe check (nel server non esiste window)
    if (typeof window !== 'undefined') {
      const userData = this.authService.getUserData();
      this.isLoggedIn = !!userData;
      this.isAdmin = userData && userData.role === 'ADMIN';
      // Emettiamo lo stato esistente per sincronizzare il BehaviorSubject con il localStorage
      this.authService.emitAuthState(userData);
    }

    // ── Iscrizione ai cambiamenti di stato auth ─────────────────────────────
    // Ogni volta che l'utente fa login o logout, questo callback si esegue
    // e aggiorna isLoggedIn e isAdmin. cdr.detectChanges() aggiorna il template.
    this.authSubscription = this.authService.getAuthState().subscribe(userData => {
      this.isLoggedIn = !!userData;
      this.isAdmin = userData && userData.role === 'ADMIN';
      this.cdr.detectChanges();
    });

    // ── Caricamento categorie e sottocategorie ──────────────────────────────
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        // setTimeout(..., 0): trucco per posticipare l'aggiornamento al ciclo successivo
        // di change detection. Risolve l'errore Angular NG0100 "ExpressionChangedAfterItHasBeenChecked"
        // che si verifica quando si aggiornano dati durante la fase di rendering.
        setTimeout(() => {
          this.categories = categories;

          // Per ogni categoria carichiamo le sue sottocategorie in parallelo
          categories.forEach(category => {
            this.subcategoryService.getSubcategoriesByCategory(category.id).subscribe({
              next: (subcategories) => {
                // Popoliamo la mappa: this.subcategoriesMap[3] = [sottocategoria1, ...]
                this.subcategoriesMap[category.id] = subcategories;
                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error(`Error fetching subcategories for category ${category.id}:`, error);
              }
            });
          });

          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Error fetching categories:', error);
      }
    });
  }

  /**
   * Apre/chiude il dropdown di una categoria.
   * event.preventDefault() + stopPropagation() evitano che il click propaghi
   * al documento e attivi immediatamente onDocumentClick() chiudendo il menu.
   */
  toggleMenu(menuName: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation(); // Ferma la propagazione verso @HostListener del documento
    // Toggle: se il menu cliccato è già aperto lo chiude, altrimenti lo apre
    this.activeMenu = this.activeMenu === menuName ? null : menuName;
  }

  /**
   * @HostListener('document:click'): ascolta i click ovunque nel documento.
   * Quando l'utente clicca fuori dal menu, activeMenu viene azzerato e i dropdown si chiudono.
   * Funziona in coppia con stopPropagation() in toggleMenu().
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.activeMenu = null;
  }

  /** Esegue il logout e torna alla home */
  logout(): void {
    this.authService.logout(); // Rimuove localStorage e notifica il BehaviorSubject
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    // IMPORTANTE: cancellare sempre setInterval e Subscription in ngOnDestroy
    // per evitare memory leak e comportamenti indesiderati dopo la distruzione del componente
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
