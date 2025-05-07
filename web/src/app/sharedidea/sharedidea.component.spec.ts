import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedideaComponent } from './sharedidea.component';

describe('SharedideaComponent', () => {
  let component: SharedideaComponent;
  let fixture: ComponentFixture<SharedideaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedideaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedideaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
