import { RexarTag } from '../nodes/rexar-tag';
import { RexarContainer } from './rexar-container';

export class TagGroupContainer extends RexarContainer {
  constructor(...elems: RexarTag[]) {
    super({
      render: () => elems.map((child) => child.render()),
    });
  }
}
