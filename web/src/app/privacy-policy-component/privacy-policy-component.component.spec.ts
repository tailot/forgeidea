import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyPolicyComponentComponent } from './privacy-policy-component.component';

describe('PrivacyPolicyComponentComponent', () => {
  let component: PrivacyPolicyComponentComponent;
  let fixture: ComponentFixture<PrivacyPolicyComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPolicyComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicyComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
