import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css']
})
export class ChangePasswordComponent {
  userName: string = '';
  msg: string = '';

  constructor(
    public dialogRef: MatDialogRef<ChangePasswordComponent>,
    private authService: AuthService
  ) {}

  inviaRichiesta() {
    if (this.userName) {
      this.authService.requestPasswordReset(this.userName).subscribe({
        next: (r: any) => {
          this.msg = "Email sent! Check your inbox.";
        },
        error: (err: any) => {
          this.msg = "Error: " + err.message;
        }
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
}