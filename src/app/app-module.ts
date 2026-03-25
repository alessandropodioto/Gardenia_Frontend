import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';

import { App } from './app';
import { HeaderComponent } from './header/header';
import { Footer } from './footer/footer';
import { HomeComponent } from './home/home';

import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    App,
    Footer 
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    MatIconModule,
    MatBadgeModule,
    MatButtonModule,
    HeaderComponent, 
    HomeComponent
  ],
  providers: [],
  bootstrap: [App]
})
export class AppModule { }