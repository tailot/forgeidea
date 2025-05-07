import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingComponentComponent } from './landing-component.component';

describe('LandingComponentComponent', () => {
  let component: LandingComponentComponent;
  let fixture: ComponentFixture<LandingComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
