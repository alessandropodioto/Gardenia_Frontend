import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  isAdmin: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Only check authentication in browser environment
    if (typeof window !== 'undefined') {
      const userData = this.authService.getUserData();
      this.isAdmin = userData && userData.role === 'ADMIN';
    }
  }
}
