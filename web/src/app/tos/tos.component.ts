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
export class TosComponent {
  productOwner = {
    productName: environment.productName,
    nameANDsurname: environment.nameANDsurname,
    email: environment.email
  }
}
