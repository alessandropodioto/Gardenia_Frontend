import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule } from '@angular/forms';

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
import { Login } from './componenti/login/login';
import { Register } from './componenti/register/register';
import { AuthService } from './services/auth.service';

import { CarrelloComponent } from './carrello/carrello';

@NgModule({
  declarations: [App, Login, Register, CarrelloComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatProgressSpinnerModule
  ],
  providers: [
    provideHttpClient(withFetch()),
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    AuthService
  ],
  bootstrap: [App],
})
export class AppModule {}
