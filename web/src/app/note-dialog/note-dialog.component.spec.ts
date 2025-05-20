import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { NoteDialogComponent } from './note-dialog.component';
import { NoteDialogData } from './note-dialog.component';

// Mock data for MAT_DIALOG_DATA
const mockDialogData: NoteDialogData = {
  note: { text: 'Test Note' },
  index: 0,
  isFirst: true,
  isLast: false,
};

// Mock MatDialogRef
const mockMatDialogRef = {
  close: jasmine.createSpy('close'),
};

describe('NoteDialogComponent', () => {
  let component: NoteDialogComponent;
  let fixture: ComponentFixture<NoteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
