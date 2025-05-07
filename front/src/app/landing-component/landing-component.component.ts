import { Component, OnInit, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-landing-component',
  standalone: true,
  template: '',
})
export class LandingComponentComponent implements OnInit {

  private languageService = inject(LanguageService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const currentLangCode = this.languageService.getCurrentLanguageCode();

      console.log(`LandingComponent: Lingua determinata dal LanguageService: ${currentLangCode}`);

      if (currentLangCode === 'it') {
        console.log('LandingComponent: Reindirizzamento a /landing.html');
        window.location.replace('/landing.html');
      } else {
        console.log('LandingComponent: Reindirizzamento a /landing_en.html');
        window.location.replace('/landing_en.html');
      }
    } else {
      console.log('LandingComponent: Esecuzione non nel browser, nessun reindirizzamento.');
    }
  }
}
