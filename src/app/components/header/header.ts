import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.css',
  standalone: false,
})
export class HeaderComponent implements OnInit, OnDestroy {

  phrases: string[] = [
    'Free shipping on orders over €79',
    'Fast delivery throughout Italy',
    'Easy returns within 30 days',
    '10% discount on your first order!'
  ];

  currentIndex: number = 0;
  private intervalId: any;
  private authSubscription: Subscription | null = null;
  isAdmin: boolean = false;
  isLoggedIn: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.phrases.length;
      this.cdr.detectChanges();
    }, 4000);

    // Check authentication state on browser (for SSR compatibility)
    if (typeof window !== 'undefined') {
      const userData = this.authService.getUserData();
      this.authService.emitAuthState(userData); // Initialize BehaviorSubject with current state
    }

    // Subscribe to authentication state changes
    this.authSubscription = this.authService.getAuthState().subscribe(userData => {
      this.isLoggedIn = !!userData;
      this.isAdmin = userData && userData.role === 'ADMIN';
      this.cdr.detectChanges();
    });
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Unsubscribe from authentication state to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
