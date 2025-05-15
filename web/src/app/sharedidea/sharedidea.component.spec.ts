import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedIdeaComponent } from './sharedidea.component';

describe('SharedideaComponent', () => {
  let component: SharedIdeaComponent;
  let fixture: ComponentFixture<SharedIdeaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedIdeaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
