import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { CarrelloComponent } from './carrello/carrello';

@NgModule({

  declarations: [App, CarrelloComponent], 
  imports: [
    BrowserModule,
   
    BrowserAnimationsModule,
    HttpClientModule,
    
    AppRoutingModule,

    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  providers: [],
  bootstrap: [App],
})
export class AppModule {}