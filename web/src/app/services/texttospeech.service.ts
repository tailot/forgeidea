// Angular Core
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
      const paragraphs = text.split('\n');
      const maxChunkLength = 2000;

      paragraphs.forEach(paragraph => {
        if (paragraph.length <= maxChunkLength) {
          this.speakChunk(paragraph, lang);
        } else {
          const sentences = paragraph.match(/[^.?!]+[.?!]+/g) || [paragraph]; // Simple sentence splitting
          let currentChunk = '';
          sentences.forEach(sentence => {
            if (currentChunk.length + sentence.length <= maxChunkLength) {
              currentChunk += sentence;
            } else {
              this.speakChunk(currentChunk, lang);
              currentChunk = sentence;
            }
          });
          if (currentChunk) {
            this.speakChunk(currentChunk, lang);
          }
        }
      });
    } else {
      console.error('TexttospeechService: Speech Synthesis not supported or text not provided.');
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

  private speakChunk(text: string, lang: string): void {
    if (text.trim()) {
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = lang;
      this.synth.speak(utterance);
    } else {
      console.warn("TexttospeechService: Empty text provided to speakChunk.");
    }
  }

}