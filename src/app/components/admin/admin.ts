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
                    next: () => this.loadProducts(),
                    error: (err) => {
                      console.error('Errore salvataggio di alcune immagini', err);
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
              console.error('Errore durante la creazione del prodotto:', err);
            }
          });
      });
  }


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
        next: (_updatedProduct: any) => { 
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
          this.deleteProduct(product); 
        }
      });
  }

  deleteProduct(product: Product): void {
    this.productService.softDelete(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
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
    if (!newStatus) return; 

    const updatedOrder = { ...order, status: newStatus }; 
    this.userorderService.update(updatedOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const index = this.orders.findIndex(o => o.id === order.id);
          if (index !== -1) {
            this.orders[index].statusDescription = newStatus;
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
