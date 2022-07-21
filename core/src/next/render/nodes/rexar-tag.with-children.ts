import { ElementRole } from '../@types/ElementRole';
import { IRenderable } from '../@types/IRenderable';
import { RexarContainer } from '../containers/rexar-container';
import { Dynamic } from '../decorators/dynamic.decorator';
import { RexarTag, Attributes } from './rexar-tag';

@Dynamic
export class RexarTagWithChildren extends RexarTag implements IRenderable {
  constructor(
    name: string,
    attibutes: Attributes = null,
    private container: RexarContainer,
  ) {
    super(name, attibutes);
  }

  override render(): Element {
    const element = super.render();
    this.container.binding$.next({
      element: element,
      role: ElementRole.Parent,
    });
    this.container.inject();
    return element;
  }
}
