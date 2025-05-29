import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { SettingsDominiumComponent } from './settings-dominium.component';

describe('SettingsDominiumComponent', () => {
  let component: SettingsDominiumComponent;
  let fixture: ComponentFixture<SettingsDominiumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsDominiumComponent, HttpClientTestingModule],
      providers: [provideZonelessChangeDetection()]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SettingsDominiumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
