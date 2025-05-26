// Angular Core
import { Component, ChangeDetectionStrategy } from '@angular/core';

// Environment
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-tos',
  imports: [],
  templateUrl: './tos.component.html',
  styleUrl: './tos.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true

})
/**
 * Component responsible for displaying the Terms of Service (ToS) for the application.
 * It sources product-specific details like product name, owner's name, and contact email
 * from the environment configuration to populate the ToS content dynamically.
 * This component is typically used as a static page.
 */
export class TosComponent {
  /**
   * An object containing details about the product and its owner,
   * sourced from the application's environment configuration.
   * This information is used to personalize the Terms of Service content.
   *
   * Includes:
   * - `productName`: The name of the application/product.
   * - `nameANDsurname`: The name and surname of the product owner or legal entity.
   * - `email`: The contact email address for inquiries related to the ToS or product.
   */
  productOwner = {
    productName: environment.productName,
    nameANDsurname: environment.nameANDsurname,
    email: environment.email
  }
}
