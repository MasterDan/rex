import { IRenderable } from '../@types/IRenderable';
import { RexarTag, Attributes } from './rexar-tag';

export class RexarTagWithChildren extends RexarTag implements IRenderable {
  constructor(
    name: string,
    attibutes: Attributes = null,
    private children: IRenderable,
  ) {
    super(name, attibutes);
  }

  override render(): Element {
    const element = super.render();
    const children = this.children.render();
    if (Array.isArray(children)) {
      element.append(...children);
    } else {
      element.append(children);
    }
    return element;
  }
}
