// Angular Core
import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
// Angular Common
import { CommonModule, DOCUMENT } from '@angular/common';
// Angular Material Modules
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-settings-theme',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatCardModule],
  templateUrl: './settings-theme.component.html',
  styleUrl: './settings-theme.component.sass'
})
export class SettingsThemeComponent implements OnInit {
  isDarkMode: boolean = false;
  isDarkModeActive: boolean = false;

  private readonly darkThemeClass = 'theme-dark';
  private readonly lightThemeClass = 'theme-light';

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  ngOnInit(): void {
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.isDarkModeActive = this.isDarkMode;
    this.applyTheme();
  }

  private applyTheme(): void {
    this.renderer.removeClass(this.document.body, this.isDarkMode ? this.lightThemeClass : this.darkThemeClass);
    this.renderer.addClass(this.document.body, this.isDarkMode ? this.darkThemeClass : this.lightThemeClass);
  }
}
