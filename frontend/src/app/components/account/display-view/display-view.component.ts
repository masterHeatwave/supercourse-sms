import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PrimaryDropdownComponent } from '@components/inputs/primary-dropdown/primary-dropdown.component';

interface LanguageOption {
  label: string;
  value: string;
}

interface ThemeOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-display-view',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    FormsModule,
    TranslateModule,
    PrimaryDropdownComponent
  ],
  templateUrl: './display-view.component.html',
  styleUrl: './display-view.component.scss'
})
export class DisplayViewComponent implements OnInit {
  selectedLanguage: string = 'en';
  selectedTheme: string = 'light';

  languages: LanguageOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Ελληνικά', value: 'el' }
  ];

  themes: ThemeOption[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Auto', value: 'auto' }
  ];

  constructor(private translateService: TranslateService) {}

  ngOnInit() {
    // Get current language
    this.selectedLanguage = this.translateService.currentLang || 'en';
    
    // TODO: Get current theme from service/localStorage
    this.selectedTheme = localStorage.getItem('theme') || 'light';
  }

  onLanguageChange() {
    this.translateService.use(this.selectedLanguage);
    localStorage.setItem('language', this.selectedLanguage);
  }

  onThemeChange() {
    // TODO: Implement theme change logic
    localStorage.setItem('theme', this.selectedTheme);
    console.log('Theme changed to:', this.selectedTheme);
  }
}

