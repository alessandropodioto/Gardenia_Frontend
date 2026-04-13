import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
 templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPasswordComponent implements OnInit {
  userName: string | null = null;
  newPassword = '';
  confirmPassword = '';
  msg = signal("");

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router  
  ) {}

  ngOnInit(): void {
    // Leggiamo lo username dall'URL
    this.userName = this.route.snapshot.paramMap.get("id");
  }

  cambiaPassword() {
    // 1. Controllo se i campi sono vuoti
    if (!this.newPassword || !this.confirmPassword) {
      this.msg.set("Please fill in both password fields.");
      return;
    }

    // 2. Controllo se le password corrispondono 
    if (this.newPassword !== this.confirmPassword) {
      this.msg.set("Passwords do not match! Please check again.");
      return;
    }

    // 3. Se corrispondono, procedo con la chiamata al backend
    if (this.userName) {
      const req = {
        userName: this.userName,
        newPassword: this.newPassword
      };

      this.authService.changePassword(req).subscribe({
        next: (r: any) => {
          this.msg.set("Password changed successfully! You can now log in.");
        },
        error: (err: any) => {
          this.msg.set("Error: " + err.message);
        }
      });
    }
  }
}