import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Gardenia_Frontend');
  // Non serve nient'altro per il carrello al momento! Material fa tutto il lavoro sporco.
}