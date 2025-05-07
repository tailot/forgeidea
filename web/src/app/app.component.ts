import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';
import { LoadingService } from './services/loading.service';
import { CommonModule } from '@angular/common';
import { ConsoleOverrideService } from './services/consoleoverride.service';

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
export class AppComponent {
  title = 'forge IDEA';

  constructor(
    public loadingService: LoadingService,
    private consoleOverrideService: ConsoleOverrideService) { }
}
