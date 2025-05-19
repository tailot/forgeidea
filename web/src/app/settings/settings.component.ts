// Angular Core and Common
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

// Application-specific Components
import { SettingsDatabasesComponent } from '../settings-databases/settings-databases.component';
import { SettingsDominiumComponent } from '../settings-dominium/settings-dominium.component';
import { SettingsScoreComponent } from '../settings-score/settings-score.component';


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    SettingsDatabasesComponent,
    SettingsScoreComponent,
    SettingsDominiumComponent,
    CommonModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent {
  refresh = true;
  dominium = false;

  dominiumIs(isDominium: boolean){
    this.dominium = isDominium;
  }

  databaseIsChanged() {
    this.refresh = false;

    setTimeout(() => {
      this.refresh = true;
    });
  }
}
