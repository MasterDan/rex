import { documentKey } from '@/constants';
import { resolve } from '@/di/di-container';
import { ElementRole } from '../@types/ElementRole';
import { IRenderable } from '../@types/IRenderable';
import { RenderResult } from '../@types/renderResult';
import { RenderResultGroup } from '../@types/RenderResultGroup';
import { RexarContainer } from '../containers/rexar-container';

export class FragmentTemplate implements IRenderable {
  document = resolve<Document>(documentKey);

  constructor(private container: RexarContainer) {}

  render(): RenderResult | RenderResultGroup {
    const fragment = this.document.createDocumentFragment();
    this.container.binding$.next({
      role: ElementRole.Parent,
      element: fragment,
    });
    this.container.inject();
    const result: RenderResultGroup = [];
    fragment.childNodes.forEach((child) => {
      if (child.nodeType === child.TEXT_NODE && child.textContent != null) {
        result.push(child.textContent);
      } else if (child.nodeType === child.ELEMENT_NODE) {
        result.push(child as Element);
      }
    });

    return result;
  }
}
