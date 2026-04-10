import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  userName: string = '';
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    const userData = this.authService.getUserData();
    this.userName = userData?.id ?? 'User';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
