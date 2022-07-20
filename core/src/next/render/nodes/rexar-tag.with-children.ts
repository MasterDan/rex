import {
  IContainerBinding,
  IContainerTarget,
  IRenderable,
} from '../@types/IRenderable';
import { RexarContainer } from '../containers/rexar-container';
import { Dynamic } from '../decorators/dynamic.decorator';
import { RexarTag, Attributes } from './rexar-tag';

@Dynamic
export class RexarTagWithChildren
  extends RexarTag
  implements IRenderable, IContainerTarget
{
  constructor(
    name: string,
    attibutes: Attributes = null,
    private children: (IRenderable | RexarContainer)[],
  ) {
    super(name, attibutes);
  }

  bindContainer(container: RexarContainer): IContainerBinding {
    const index = this.children.indexOf(container);

    throw new Error('Method not implemented.');
  }

  override render(): Element {
    throw new Error('Method not implemented.');
    const element = super.render();

    return element;
  }
}
