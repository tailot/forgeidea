import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateCategoryComponent } from './generate-category.component';

describe('GenerateCategoryComponent', () => {
  let component: GenerateCategoryComponent;
  let fixture: ComponentFixture<GenerateCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateCategoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
