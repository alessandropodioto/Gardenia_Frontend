import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-carrello',
  standalone: false,
  templateUrl: './carrello.html',
  styleUrl: './carrello.css'
})
export class CarrelloComponent {
  // This event tells the main app to close the sidebar
  @Output() chiudi = new EventEmitter<void>();
}