// Angular Core and Common
import { DOCUMENT, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';

// Environment
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.sass'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyPolicyComponent implements OnInit {
  websiteUrl: string;
  productOwner = {
    productName: environment.productName,
    nameANDsurname: environment.nameANDsurname,
    email: environment.email
  }
  constructor(@Inject(DOCUMENT) private document: Document) {
    this.websiteUrl = '';
  }

  ngOnInit(): void {
    this.websiteUrl = this.document.location.origin;
  }
}