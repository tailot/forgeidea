// Angular Core
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  template: '',
})
export class LandingComponent implements OnInit {

  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
        console.log('LandingComponent: redirect to /landing.html');
        window.location.replace('/landing.html');
   
    } else {
      console.log('LandingComponent: no redirection.');
    }
  }
}
