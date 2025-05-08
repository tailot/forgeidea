import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy-component',
  templateUrl: './privacy-policy-component.component.html',
  styleUrls: ['./privacy-policy-component.component.sass'],
  standalone: true,
  imports: [CommonModule]
})
export class PrivacyPolicyComponentComponent implements OnInit {
  websiteUrl: string;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.websiteUrl = '';
  }

  ngOnInit(): void {
    this.websiteUrl = this.document.location.origin;
  }
}