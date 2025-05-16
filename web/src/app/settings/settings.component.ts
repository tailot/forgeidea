import { Component } from '@angular/core';

import { SettingsDatabasesComponent } from '../settings-databases/settings-databases.component';
import { SettingsScoreComponent } from '../settings-score/settings-score.component';
import { SettingsDominiumComponent } from '../settings-dominium/settings-dominium.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    SettingsDatabasesComponent,
    SettingsScoreComponent,
    SettingsDominiumComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent {}
