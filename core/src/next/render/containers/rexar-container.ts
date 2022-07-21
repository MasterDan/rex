import { documentKey } from 'core/src/di/constants';
import { lastEl } from 'core/src/tools/array';
import { BehaviorSubject, Subject } from 'rxjs';
import { Resolvable } from '../../di/resolvable.decorator';
import { ElementRole } from '../@types/ElementRole';
import { IContainerBinding, IRenderable } from '../@types/IRenderable';

@Resolvable({ dependencies: [documentKey] })
export class RexarContainer {
  template: IRenderable | undefined;

  binding$ = new BehaviorSubject<IContainerBinding | null>(null);

  bindingOwn$ = new Subject<IContainerBinding>();

  size$ = new BehaviorSubject(0);

  constructor(private document: Document) {}

  public inject(): void {
    if (this.template == undefined || this.binding$.value == null) {
      this.size$.next(0);
      return;
    }
    let reendered = this.template?.render();
    const target = this.binding$.value;
    if (reendered === undefined) {
      this.size$.next(0);
      this.bindingOwn$.next(this.binding$.value);
      return;
    }
    const fragment = this.document.createDocumentFragment();
    reendered = Array.isArray(reendered) ? reendered : [reendered];
    let lastRenderedItem = lastEl(reendered);
    if (typeof lastRenderedItem === 'string') {
      const template = this.document.createElement('template');
      reendered.push(template);
      lastRenderedItem = template;
    }

    fragment.append(...reendered);
    if (target.role == ElementRole.Parent) {
      target.element.prepend(fragment);
    } else if (target.role == ElementRole.NextSibling) {
      target.parent?.insertBefore(fragment, target.element);
    } else if (target.role == ElementRole.PreviousSibling) {
      target.parent?.insertBefore(fragment, target.element.nextSibling);
    }
    this.size$.next(reendered.length);
    this.bindingOwn$.next({
      element: lastRenderedItem,
      role: ElementRole.PreviousSibling,
    });
  }
}
