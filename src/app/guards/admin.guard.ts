import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    // Only check authentication in browser environment
    if (typeof window !== 'undefined') {
      const userData = this.authService.getUserData();

      // Check if user is logged in and has ADMIN role
      if (!userData || userData.role !== 'ADMIN') {
        // Redirect to home if not admin
        this.router.navigate(['/home']);
        return false;
      }

      return true;
    }

    // On server, allow access (will be checked again on client)
    return true;
  }
}
