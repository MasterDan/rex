import { documentKey } from 'core/src/di/constants';
import { lastEl } from 'core/src/tools/array';
import { BehaviorSubject, Subject } from 'rxjs';
import { resolve } from '../../di/di-container';
import { ElementRole } from '../@types/ElementRole';
import { ContainerBinding, IRenderable } from '../@types/IRenderable';

export class RexarContainer {
  binding$ = new BehaviorSubject<ContainerBinding | null>(null);

  bindingOwn$ = new Subject<ContainerBinding>();

  size$ = new BehaviorSubject(0);

  private document = resolve<Document>(documentKey);

  constructor(private template?: IRenderable) {}

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
      target.parent.insertBefore(fragment, target.element);
    } else if (target.role == ElementRole.PreviousSibling) {
      target.parent.insertBefore(fragment, target.element.nextSibling);
    }
    this.size$.next(reendered.length);
    this.bindingOwn$.next({
      parent: target.parent,
      element: lastRenderedItem,
      role: ElementRole.PreviousSibling,
    });
  }
}
