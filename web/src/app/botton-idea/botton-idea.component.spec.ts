import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { BottonIdeaComponent } from './botton-idea.component';

describe('BottonIdeaComponent', () => {
  let component: BottonIdeaComponent;
  let fixture: ComponentFixture<BottonIdeaComponent>;
  let httpMock: HttpTestingController;


  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [
        BottonIdeaComponent,
        HttpClientTestingModule,
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(BottonIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});