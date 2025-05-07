import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobcardComponent } from './jobcard.component';

describe('JobcardComponent', () => {
  let component: JobcardComponent;
  let fixture: ComponentFixture<JobcardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobcardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
