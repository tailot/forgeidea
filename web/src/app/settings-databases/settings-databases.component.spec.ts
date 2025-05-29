import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideZonelessChangeDetection } from '@angular/core';
import { SettingsDatabasesComponent } from './settings-databases.component';

describe('SettingsDatabasesComponent', () => {
  let component: SettingsDatabasesComponent;
  let fixture: ComponentFixture<SettingsDatabasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsDatabasesComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsDatabasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
