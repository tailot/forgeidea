import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CardIdeaComponent } from './card-idea.component';

describe('CardIdeaComponent', () => {
  let component: CardIdeaComponent;
  let fixture: ComponentFixture<CardIdeaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardIdeaComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
