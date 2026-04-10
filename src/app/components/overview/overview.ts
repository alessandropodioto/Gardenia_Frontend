import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { UserorderService, UserOrder } from '../../services/userorder.service';
import { EditProfile } from '../../dialogs/edit-profile/edit-profile';

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
  latestOrder: UserOrder | null = null;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private userOrderService: UserorderService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (!userData?.id) {
      this.isLoading = false;
      return;
    }

    const userName = userData.id;

    this.authService.getUserByUserName(userName).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
      }
    });

    this.userOrderService.getOrdersByUser(userName).subscribe({
      next: (orders) => {
        if (orders?.length > 0) {
          this.latestOrder = orders.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  openEditDialog(): void {
    if (!this.userProfile) return;

    const ref = this.dialog.open(EditProfile, {
      data: {
        userName: this.userProfile.userName,
        email: this.userProfile.email,
        phone: this.userProfile.phone,
      },
    });

    ref.afterClosed().subscribe((updated) => {
      if (updated) {
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
