import { TestBed } from '@angular/core/testing';

import { TexttospeechService } from './texttospeech.service';

describe('TexttospeechService', () => {
  let service: TexttospeechService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TexttospeechService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
