import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TexttospeechService {
  private synth: SpeechSynthesis;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  speak(text: string, lang: string = 'en-US'): void {
    if (this.synth && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;

      if (this.synth.speaking) {
        this.synth.cancel();
      }
      this.synth.speak(utterance);
    } else {
      console.error('Speech Synthesis non supportata o testo non fornito.');
    }
  }

  stop(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }

  isSpeaking(): boolean {
    if ('speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synth ? this.synth.getVoices() : [];
  }
}