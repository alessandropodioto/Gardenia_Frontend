import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (typeof window !== 'undefined') {
      const userData = this.authService.getUserData();

      if (!userData || userData.role !== 'ADMIN') {
        this.router.navigate(['/home']);
        return false;
      }

      return true;
    }

    return true;
  }
}
