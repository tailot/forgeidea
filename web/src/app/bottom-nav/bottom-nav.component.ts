import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Observable, Subscription } from 'rxjs';

import { OnlineStatusService } from '../services/onlinestatus.service';
import { SettingsThemeComponent } from '../settings-theme/settings-theme.component';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatToolbarModule, RouterLink, RouterLinkActive, SettingsThemeComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottomNavComponent implements OnInit, OnDestroy {
  isOnline$: Observable<boolean>;
  private onlineStatusSubscription: Subscription | undefined;

  constructor(
    public onlineStatusService: OnlineStatusService,
    private router: Router
  ) {
    this.isOnline$ = this.onlineStatusService.isOnline$;
  }

  ngOnInit(): void {
    this.onlineStatusSubscription = this.onlineStatusService.isOnline$.subscribe(isOnline => {
      if (!isOnline) {
        this.router.navigate(['/list']);
      }
    });
  }

  ngOnDestroy(): void {
    this.onlineStatusSubscription?.unsubscribe();
  }
}
