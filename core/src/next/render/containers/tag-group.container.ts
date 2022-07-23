import { IRenderable } from '../@types/IRenderable';
import { RexarTag } from '../nodes/rexar-tag';
import { RexarContainer } from './rexar-container';

export class TagGroupContainer extends RexarContainer implements IRenderable {
  constructor(...elems: RexarTag[]) {
    super({
      render: () => elems.map((child) => child.render()),
    });
  }

  render() {
    return this.template?.render() ?? [];
  }
}
