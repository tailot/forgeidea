import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let consoleSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }] // Simula una piattaforma non browser
    })
    .compileComponents();

    consoleSpy = spyOn(console, 'log');

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not redirect and log "LandingComponent: no redirection." if not in browser', () => {
    expect(consoleSpy).toHaveBeenCalledWith('LandingComponent: no redirection.');
  });
});
