import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Observable } from 'rxjs';


import { OnlineStatusService } from '../services/onlinestatus.service';


@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatToolbarModule, RouterLink, RouterLinkActive], // Aggiungi CommonModule
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.sass'
})
export class BottomNavComponent {
  isOnline$: Observable<boolean>;
  constructor(public onlineStatusService: OnlineStatusService) {
    this.isOnline$ = this.onlineStatusService.isOnline$;
  }
}
