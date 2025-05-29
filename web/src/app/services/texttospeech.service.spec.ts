import { TestBed } from '@angular/core/testing';

import { provideZonelessChangeDetection } from '@angular/core';
import { TexttospeechService } from './texttospeech.service';

describe('TexttospeechService', () => {
  let service: TexttospeechService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(TexttospeechService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
