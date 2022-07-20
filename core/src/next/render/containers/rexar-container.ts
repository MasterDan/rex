import { documentKey } from 'core/src/di/constants';
import { BehaviorSubject } from 'rxjs';
import { Resolvable } from '../../di/resolvable.decorator';
import { ElementRole } from '../@types/ElementRole';
import { IContainerBinding, IRenderable } from '../@types/IRenderable';

@Resolvable({ dependencies: [documentKey] })
export class RexarContainer {
  template: IRenderable | undefined;

  binding: IContainerBinding | undefined;

  size$ = new BehaviorSubject(0);

  constructor(private document: Document) {}

  protected inject(): void {
    if (this.template == undefined || this.binding == undefined) {
      this.size$.next(0);
      return;
    }
    let reendered = this.template?.render();
    const target = this.binding.target();
    if (reendered === undefined) {
      this.size$.next(0);
      return;
    }
    const fragment = this.document.createDocumentFragment();
    reendered = Array.isArray(reendered) ? reendered : [reendered];
    fragment.append(...reendered);
    if (target.role == ElementRole.Parent) {
      target.element.append(fragment);
    } else if (target.role == ElementRole.NextSibling) {
      target.parent?.insertBefore(fragment, target.element);
    } else if (target.role == ElementRole.PreviousSibling) {
      target.parent?.insertBefore(fragment, target.element.nextSibling);
    }
    this.size$.next(reendered.length);
  }
}
