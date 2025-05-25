/**
 * @fileoverview Defines the `PrivacyPolicyComponent` for the Angular web application.
 *
 * This component is responsible for displaying the application's privacy policy.
 * It dynamically populates parts of the policy, such as the website URL and
 * product owner contact details, using information from the global `document` object
 * and the application's environment configuration (`environment.ts`).
 * The component uses `ChangeDetectionStrategy.OnPush` for performance optimization,
 * as its content is largely static after initialization.
 */
// Angular Core and Common
import { DOCUMENT, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';

// Environment
import { environment } from '../../environments/environment';

/**
 * A standalone component that displays the application's privacy policy.
 *
 * The content of the privacy policy is primarily defined in its HTML template.
 * This component dynamically injects the current website URL and product owner
 * information (name, product name, email) sourced from the application's
 * environment configuration into the policy text.
 * It uses `ChangeDetectionStrategy.OnPush` as the policy content is generally
 * static once rendered.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-privacy-policy' - The HTML tag used to embed this component.
 *  - `standalone`: true - Indicates that this is a standalone component.
 *  - `imports`:
 *    - `CommonModule`: Provides common Angular directives like `*ngIf`, `*ngFor`, and pipes.
 *  - `templateUrl`: './privacy-policy.component.html' - Path to the component's HTML template.
 *  - `styleUrls`: ['./privacy-policy.component.sass'] - Path to the component's Sass stylesheet(s).
 *  - `changeDetection`: `ChangeDetectionStrategy.OnPush` - Optimizes change detection to run
 *    primarily when inputs change or events occur, suitable for components with largely static content.
 *
 * Implements:
 *  - `OnInit`: Lifecycle hook for initialization logic, used here to set the `websiteUrl`.
 */
@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.sass'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyPolicyComponent implements OnInit {
  /**
   * The root URL of the website where the application is hosted.
   * This is determined dynamically in `ngOnInit` using `document.location.origin`.
   * It's used to display the current website's address within the privacy policy.
   * @type {string}
   */
  websiteUrl: string;

  /**
   * An object containing details about the product owner, sourced from the
   * application's environment configuration (`environment.ts`).
   * This information is used to populate contact and owner details in the privacy policy.
   * @property {string} productName - The name of the product or application.
   * @property {string} nameANDsurname - The name and surname of the product owner or contact person.
   * @property {string} email - The contact email address for the product owner.
   */
  productOwner = {
    productName: environment.productName,
    nameANDsurname: environment.nameANDsurname,
    email: environment.email
  };

  /**
   * Constructs the PrivacyPolicyComponent.
   *
   * @param {Document} document - The global `document` object, injected using the `DOCUMENT` token.
   *                              This is used to access the current website's location (origin).
   *                              Marked as private as it's only used within the constructor and `ngOnInit`.
   */
  constructor(@Inject(DOCUMENT) private document: Document) {
    this.websiteUrl = ''; // Initialize to an empty string before ngOnInit sets the actual value.
  }

  /**
   * Angular lifecycle hook that is called after Angular has initialized all data-bound
   * properties of a directive.
   *
   * In this component, `ngOnInit` is used to set the `websiteUrl` property by
   * dynamically retrieving the current website's origin (e.g., "https://www.example.com")
   * from `this.document.location.origin`. This ensures that the privacy policy
   * accurately reflects the domain it's being served from.
   */
  ngOnInit(): void {
    this.websiteUrl = this.document.location.origin;
  }
}