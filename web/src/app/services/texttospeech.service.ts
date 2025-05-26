// Angular Core
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
/**
 * Service to provide text-to-speech functionality using the browser's SpeechSynthesis API.
 * It handles speaking text, stopping speech, checking speech status, and retrieving available voices.
 * Note: Browser support and available voices can vary.
 */
export class TexttospeechService {
  private synth: SpeechSynthesis;

  /**
   * Initializes the TextToSpeechService by acquiring a reference to the
   * browser's `speechSynthesis` interface.
   */
  constructor() {
    this.synth = window.speechSynthesis;
  }

  /**
   * Speaks the provided text using the specified language.
   * The text is split into paragraphs and then further into manageable chunks
   * to avoid issues with very long text inputs. Each chunk is queued for speech.
   *
   * @param text The text content to be spoken.
   * @param lang The language code (e.g., 'en-US', 'es-ES') for the speech synthesis.
   *             Defaults to 'en-US'.
   */
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

  /**
   * Stops any currently ongoing or queued speech.
   * If speech synthesis is active, it will be cancelled.
   */
  stop(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }

  /**
   * Checks if the speech synthesis engine is currently speaking.
   * @returns `true` if speech is in progress, `false` otherwise.
   */
  isSpeaking(): boolean {
    if ('speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }

  /**
   * Retrieves the list of available speech synthesis voices from the browser.
   * The availability of voices depends on the user's browser and operating system.
   * This list may be empty or may populate asynchronously on some browsers;
   * consider calling it after a short delay or in response to the `voiceschanged` event
   * on `window.speechSynthesis` for more reliable results in complex scenarios.
   * @returns An array of `SpeechSynthesisVoice` objects, or an empty array if not available.
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth ? this.synth.getVoices() : [];
  }

  /**
   * Creates and speaks a single chunk of text.
   * This is a helper method used by the main `speak` method.
   * @param text The chunk of text to speak.
   * @param lang The language code for the utterance.
   * @private
   */
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