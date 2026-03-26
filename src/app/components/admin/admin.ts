import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { AdminServices, User } from '../../services/admin-services';
import { DeleteUser } from '../../dialogs/delete-user/delete-user';

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
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private adminService: AdminServices,
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
          this.error = 'Errore durante il caricamento degli utenti';
          this.cdr.markForCheck();
          console.error('Error loading users:', err);
        }
      });
  }

  openDeleteDialog(user: User): void {
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
          this.confirmDelete(user.userName);
        }
      });
  }

  confirmDelete(username: string): void {
    this.adminService.deleteUser(username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.users = this.users.filter(u => u.userName !== username);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = "Errore durante l'eliminazione dell'utente";
          this.cdr.markForCheck();
          console.error('Error deleting user:', err);
        }
      });
  }
}