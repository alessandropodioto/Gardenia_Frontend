import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // Aggiungi questo import

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink], // Aggiungilo qui!
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent { }