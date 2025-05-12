import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart, RouterOutlet } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';
import { LoadingService } from './services/loading.service';
import { CommonModule } from '@angular/common';
import { ConsoleOverrideService } from './services/consoleoverride.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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
