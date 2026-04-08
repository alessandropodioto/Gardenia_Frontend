import { Component, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css'
})
export class AdminSidebar {
  @Output() viewChange = new EventEmitter<string>();
  
  activeView: string = 'users';

  switchView(view: string): void {
    this.activeView = view;
    this.viewChange.emit(view);
  }
}