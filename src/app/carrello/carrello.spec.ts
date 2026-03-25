import { ComponentFixture, TestBed } from '@angular/core/testing';

// 1. Aggiornato l'import
import { CarrelloComponent } from './carrello';

describe('CarrelloComponent', () => {
  // 2. Aggiornati i tipi
  let component: CarrelloComponent;
  let fixture: ComponentFixture<CarrelloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // 3. Aggiornata la dichiarazione
      declarations: [CarrelloComponent],
    }).compileComponents();

    // 4. Aggiornata la creazione
    fixture = TestBed.createComponent(CarrelloComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});