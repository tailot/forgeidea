// Angular Core, Common, and Router
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';

// Angular Material
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// RxJS
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Application-specific Components and Services
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';
import { ConsoleOverrideService } from './services/consoleoverride.service';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    BottomNavComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'forge IDEA';
  private routerSubscription: Subscription | undefined;

  constructor(
    public loadingService: LoadingService,
    private consoleOverrideService: ConsoleOverrideService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      this.loadingService.hide();
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
