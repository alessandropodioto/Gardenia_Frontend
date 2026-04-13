import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-email-validation',
  standalone: false,
  templateUrl: './email-validation.html',
  styleUrls: ['./email-validation.css']
})
export class EmailValidationComponent implements OnInit {
  id: string | null = null;
  msg = signal("");

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.msg.set("");
    // Legge l'ID direttamente dall'URL come ha fatto il prof
    this.id = this.route.snapshot.paramMap.get("id");
    console.log("id da convalidare:", this.id);
  }

  validate() {
    if (this.id) {
      this.authService.validateEmail(this.id).subscribe({
        next: ((r: any) => {
          this.msg.set("Email successfully validated! You can now log in.");
        }),
        error: ((err: any) => {
          this.msg.set("Validation error: " + err.message);
        })
      });
    }
  }
}