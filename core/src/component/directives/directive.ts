import { RexNode } from 'core/src/vdom/rexNode';

export abstract class Directive {
  protected transform(node: RexNode): RexNode | RexNode[] {
    return node;
  }

  __apply__(node: RexNode): RexNode | RexNode[] {
    return this.transform(node);
  }
}
