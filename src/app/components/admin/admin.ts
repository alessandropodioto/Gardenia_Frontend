import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  users: User[] = [];
  products: Product[] = [];
  orders: UserOrder[] = [];
  error: string | null = null;
  activeView: string = 'users';
  pendingStatusChanges: { [orderId: number]: string } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private adminService: AdminServices,
    private productService: ProductService,
    private userorderService: UserorderService,
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
    } else if (viewStr === 'orders') {
      this.loadOrders();
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

        // Estraiamo i dati
        const productToSave = result.productData; 
        const imageFile = result.file; 

        // Creazione prodotto
        this.productService.create(productToSave)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              // Se l'utente ha messo l'immagine, la carichiamo subito dopo!
              if (imageFile && response && response.id) {
                this.productService.uploadProductImage(imageFile, response.id)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe({
                    next: () => {
                      this.loadProducts(); 
                    },
                    error: (err) => {
                      console.error("Errore caricamento immagine", err);
                      this.loadProducts(); 
                    }
                  });
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
        const newImageFile = result.file;
        let imageIdToDelete = result.deletedImageId;

        // TRUCCO MAGICO: Se hai caricato una foto nuova (il fiore), eliminiamo 
        // quella vecchia in automatico per non creare doppioni nel Database!
        if (newImageFile && product.images && product.images.length > 0 && !imageIdToDelete) {
            const imgData: any = product.images[0];
            imageIdToDelete = imgData.imageId || imgData.id;
        }

        // Se c'è un'immagine da eliminare, la eliminiamo prima di aggiornare il prodotto
        if (imageIdToDelete) {
           this.productService.deleteImage(imageIdToDelete)
             .pipe(takeUntil(this.destroy$))
             .subscribe({
               next: () => this.updateProduct(productToUpdate, newImageFile),
               error: () => this.updateProduct(productToUpdate, newImageFile) // Aggiorniamo comunque in caso di errore
             });
        } else {
           // Se non hai toccato l'immagine, salva solo le modifiche al testo
           this.updateProduct(productToUpdate, newImageFile);
        }
      });
  }
  updateProduct(product: Product, file: File | null = null): void {
    this.productService.update(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedProduct: any) => {
          // Se durante la modifica è stata caricata una nuova immagine, la salviamo
          if (file && product && product.id) {
             this.productService.uploadProductImage(file, product.id)
               .pipe(takeUntil(this.destroy$))
               .subscribe(() => this.loadProducts());
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

  // ==============================
  // ORDER MANAGEMENT METHODS
  // ==============================
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

  updateOrderStatus(order: UserOrder): void {
    const newStatus = this.pendingStatusChanges[order.id!];
    if (!newStatus) {
      return;
    }

    const updatedOrder = { ...order, status: newStatus };
    
    this.userorderService.update(updatedOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update the order in the list
          const index = this.orders.findIndex(o => o.id === order.id);
          if (index !== -1) {
            this.orders[index].status = newStatus;
            // Clear the pending status change
            delete this.pendingStatusChanges[order.id!];
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

  onStatusChange(orderId: number, newStatus: string): void {
    this.pendingStatusChanges[orderId] = newStatus;
    this.cdr.markForCheck();
  }
}