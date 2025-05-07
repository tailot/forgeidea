import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottonIdeaComponent } from './botton-idea.component';

describe('BottomIdeaComponent', () => {
  let component: BottonIdeaComponent;
  let fixture: ComponentFixture<BottonIdeaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottonIdeaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BottonIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
