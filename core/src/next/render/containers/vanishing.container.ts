import { ElementRole } from '../@types/ElementRole';
import { RexarContainer } from './rexar-container';

export class VanishingContainer extends RexarContainer {
  vanish() {
    if (this.binding$.value == null || this.size$.value === 0) {
      return;
    }
    if (this.size$.value === 0) {
      this.bindingOwn$.next(this.binding$.value);
      return;
    }
    switch (this.binding$.value.role) {
      case ElementRole.Parent: {
        const parent = this.binding$.value.element;
        for (let i = this.size$.value - 1; i >= 0; i--) {
          parent.removeChild(parent.childNodes[i]);
        }
        break;
      }
      case ElementRole.PreviousSibling: {
        const { element, parent } = this.binding$.value;
        const startIndex =
          1 + Array.prototype.indexOf.call(parent.childNodes, element);
        const endIndex = startIndex + this.size$.value;
        for (let i = endIndex - 1; i >= startIndex; i--) {
          parent.removeChild(parent.childNodes[i]);
        }
        break;
      }
      case ElementRole.NextSibling: {
        const { element, parent } = this.binding$.value;
        const startIndex =
          Array.prototype.indexOf.call(parent.childNodes, element) - 1;
        const endIndex = startIndex - this.size$.value;
        for (let i = startIndex; i > endIndex; i--) {
          parent.removeChild(parent.childNodes[i]);
        }
        break;
      }
    }
    this.bindingOwn$.next(this.binding$.value);
  }
}
