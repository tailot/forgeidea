/**
 * @fileoverview Defines the `VerifyService` for the Angular web application.
 *
 * This service provides utility methods for verifying the availability and
 * rendering status of Angular components within the application context.
 * It can check if a component type is resolvable by the Angular framework
 * (indicating it's declared and available) and if a component instance
 * with a specific selector is currently present in the DOM.
 */
import { Injectable, ComponentFactoryResolver, Injector, Type } from '@angular/core';

/**
 * Service providing methods to verify component availability and rendering status.
 *
 * It uses Angular's `ComponentFactoryResolver` to check if a component `Type`
 * can be resolved, which typically means it's declared and included in a loaded
 * module (or is standalone). It also offers a method to check for the presence
 * of a component's selector in the DOM, indicating if an instance is rendered.
 *
 * @Injectable Decorator Details:
 *  - `providedIn`: 'root' - Makes the service available application-wide as a singleton.
 */
@Injectable({
  providedIn: 'root'
})
export class VerifyService {

  /**
   * Constructs the VerifyService.
   * @param {ComponentFactoryResolver} componentFactoryResolver - Angular's service for resolving component factories.
   * @param {Injector} injector - Angular's Injector service. While injected, it's not
   *        directly used in the current methods but might be useful for more advanced
   *        verification scenarios (e.g., checking if a component can be instantiated
   *        with specific dependencies).
   */
  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) { }

  /**
   * Verifies if a given component type is available and resolvable
   * within the application's context (i.e., it is declared in a loaded module
   * or is a standalone component).
   *
   * This check is based on whether Angular can find a `ComponentFactory` for the type.
   *
   * @param {Type<any>} componentType - The component type to verify (e.g., `MyComponent`).
   * @returns {boolean} `true` if the component type is resolvable, `false` otherwise.
   */
  isComponentAvailable(componentType: Type<any>): boolean {
    if (!componentType) {
      console.warn('VerifyService: componentType not provided.');
      return false;
    }
    try {
      // Attempt to resolve the component factory. If it succeeds, the component is available.
      const factory = this.componentFactoryResolver.resolveComponentFactory(componentType);
      return !!factory;
    } catch (error) {
      // If resolving the factory throws an error, the component is not available.
      return false;
    }
  }

  /**
   * An alias for `isComponentAvailable`, providing semantic clarity.
   * Checks if a component type is declared and included in the project's
   * build and available for use by the Angular framework.
   *
   * @param {Type<any>} componentType - The component type to verify.
   * @returns {boolean} `true` if the component is included and resolvable, `false` otherwise.
   */
  isComponentIncludedInProject(componentType: Type<any>): boolean {
    return this.isComponentAvailable(componentType);
  }

  /**
   * Checks if a component with a specific CSS selector is currently rendered
   * and present in the DOM, starting the search from a provided root element.
   *
   * This is a DOM-based check, different from `isComponentAvailable`, which
   * checks for the component's declaration and resolvability by Angular.
   *
   * @param {string} selector - The CSS selector of the component (e.g., 'app-my-component').
   * @param {Element} [rootElement=document.body] - The DOM element from which to start the search.
   *                                              Defaults to `document.body`.
   * @returns {boolean} `true` if at least one instance of the component's selector
   *          is found within the specified DOM subtree, `false` otherwise.
   */
  isComponentRendered(selector: string, rootElement: Element = document.body): boolean {
    if (!selector) {
      console.warn('VerifyService: selector not provided for isComponentRendered.');
      return false;
    }
    // Use querySelector to find the first element matching the selector within the root.
    // The !! converts the result (Element or null) into a boolean.
    return !!rootElement.querySelector(selector);
  }
}
