import { documentKey } from '@/constants';
import { lastEl } from '@/tools/array';
import { BehaviorSubject } from 'rxjs';
import { resolve } from '@/di/di-container';
import { ElementRole } from '../@types/ElementRole';
import { ContainerBinding, IRenderable } from '../@types/IRenderable';

/**
 * Container is something that can inject one Irenderable template into another
 */
export class RexarContainer {
  /** Where to inject current template */
  binding$ = new BehaviorSubject<ContainerBinding | null>(null);

  /** Where to inject next sibling container */
  bindingOwn$ = new BehaviorSubject<ContainerBinding | null>(null);

  /** Number of rendered nodes */
  size$ = new BehaviorSubject(0);

  private document = resolve<Document>(documentKey);

  constructor(protected template?: IRenderable) {}

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

    switch (target.role) {
      case ElementRole.Parent:
        target.element.prepend(fragment);
        break;
      case ElementRole.NextSibling:
        target.parent.insertBefore(fragment, target.element);
        break;
      case ElementRole.PreviousSibling:
        target.parent.insertBefore(fragment, target.element.nextSibling);
        break;
    }
    this.size$.next(reendered.length);
    this.bindingOwn$.next({
      parent:
        target.role === ElementRole.Parent ? target.element : target.parent,
      element: lastRenderedItem,
      role: ElementRole.PreviousSibling,
    });
  }
}