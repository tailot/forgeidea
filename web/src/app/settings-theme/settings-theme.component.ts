import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { StorageService } from '../services/storage.service';

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
  private readonly themeKey = 'theme-preference';
  private readonly darkThemeClass = 'theme-dark';
  private readonly lightThemeClass = 'theme-light';

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.loadThemePreference();
  }

  private loadThemePreference(): void {
    this.storageService.getItem<string>(this.themeKey).then(theme => {
        this.isDarkMode = theme === this.darkThemeClass;
        this.isDarkModeActive = this.isDarkMode;
        this.applyTheme();
    }).catch(error => {
      console.error("Error loading theme preference from database:", error);
    });
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.isDarkModeActive = this.isDarkMode;
    this.storageService.setItem(this.themeKey, this.isDarkMode ? this.darkThemeClass : this.lightThemeClass);
    this.applyTheme();
  }

  private applyTheme(): void {
    this.renderer.removeClass(this.document.body, this.isDarkMode ? this.lightThemeClass : this.darkThemeClass);
    this.renderer.addClass(this.document.body, this.isDarkMode ? this.darkThemeClass : this.lightThemeClass);
  }
}
