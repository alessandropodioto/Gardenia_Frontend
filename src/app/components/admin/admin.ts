import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
// 1. ECCO LA SOLUZIONE ALL'ERRORE: abbiamo aggiunto forkJoin qui!
import { Subject, forkJoin } from 'rxjs'; 
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { AdminServices, User } from '../../services/admin.service';
import { ProductService, Product } from '../../services/product.service';
import { DeleteUser } from '../../dialogs/delete-user/delete-user';
import { ProductDialog, ProductDialogData } from '../../dialogs/product-dialog/product-dialog';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  users: User[] = [];
  products: Product[] = [];
  error: string | null = null;
  activeView: string = 'users';

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private adminService: AdminServices,
    private productService: ProductService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const userData = this.authService.getUserData();
      this.isAdmin = userData && userData.role === 'ADMIN';

      if (this.isAdmin) {
        this.loadUsers();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onViewChange(view: string | Event): void {
    const viewStr = typeof view === 'string' ? view : '';
    this.activeView = viewStr;
    this.error = null;
    if (viewStr === 'products') {
      this.loadProducts();
    }
    this.cdr.markForCheck();
  }

  // ==============================
  // USER MANAGEMENT METHODS
  // ==============================
  loadUsers(): void {
    this.error = null;

    this.adminService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error loading users';
          this.cdr.markForCheck();
          console.error('Error loading users:', err);
        }
      });
  }

  openDeleteUserDialog(user: User): void {
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

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.confirmDeleteUser(user.userName);
        }
      });
  }

  confirmDeleteUser(username: string): void {
    this.adminService.deleteUser(username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
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

  // ==============================
  // PRODUCT MANAGEMENT METHODS
  // ==============================
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

  openCreateProductDialog(): void {
    const dialogRef = this.dialog.open(ProductDialog, {
      width: '600px',
      data: { mode: 'create', product: null } as ProductDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (!result) return;

        const productToSave = result.productData; 
        const urlsText = result.imageUrls; 

        this.productService.create(productToSave)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              
              if (urlsText && urlsText.trim() !== '' && response && response.id) {
                
                const urlArray = urlsText.split('\n')
                                         .map((u: string) => u.trim()) 
                                         .filter((u: string) => u !== ''); 

                if (urlArray.length > 0) {
                  const uploadRequests = urlArray.map((url: string) => 
                      this.productService.createImageLink(url, response.id)
                  );

                  forkJoin(uploadRequests).pipe(takeUntil(this.destroy$)).subscribe({
                    next: () => {
                      console.log("Tutte le immagini salvate con successo!");
                      this.loadProducts(); 
                    },
                    error: (err) => {
                      console.error("Errore salvataggio di alcune immagini", err);
                      this.loadProducts(); 
                    }
                  });
                } else {
                  this.loadProducts();
                }
              } else {
                this.loadProducts();
              }
            },
            error: (err) => {
              this.error = 'Error creating product';
              this.cdr.markForCheck();
              console.error("Errore durante la creazione del prodotto:", err);
            }
          });
      });
  }

  openEditProductDialog(product: Product): void {
    const dialogRef = this.dialog.open(ProductDialog, {
      width: '600px',
      data: {
        product: product,
        mode: 'edit'
      } as ProductDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (!result) return;
        
        const productToUpdate = result.productData;
        const urlsText = result.imageUrls; 
        const imageIdsToDelete: number[] = result.deletedImageIds || [];

        // Se l'utente ha modificato e inserito nuovi link, eliminiamo TUTTE le immagini vecchie
        if (urlsText && urlsText.trim() !== '' && imageIdsToDelete.length > 0) {
           
           const deleteRequests = imageIdsToDelete.map(id => this.productService.deleteImage(id));
           
           forkJoin(deleteRequests).pipe(takeUntil(this.destroy$)).subscribe({
             next: () => this.updateProduct(productToUpdate, urlsText),
             error: () => this.updateProduct(productToUpdate, urlsText) 
           });
        } else {
           this.updateProduct(productToUpdate, urlsText);
        }
      });
  }

  updateProduct(product: Product, urlsText: string | null = null): void {
    this.productService.update(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedProduct: any) => {
          
          if (urlsText && urlsText.trim() !== '' && product && product.id) {
             
             const urlArray = urlsText.split('\n')
                                      .map((u: string) => u.trim())
                                      .filter((u: string) => u !== '');
                                      
             if (urlArray.length > 0) {
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
          this.deleteProduct(product.id);
        }
      });
  }

  deleteProduct(productId: number): void {
    this.productService.delete(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== productId);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error deleting product';
          this.cdr.markForCheck();
          console.error('Error deleting product:', err);
        }
      });
  }
}