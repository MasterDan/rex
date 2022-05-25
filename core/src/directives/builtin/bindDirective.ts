import { RexNode } from 'core/src/vdom/rexNode';
import { Directive } from '../directive';

export class BindDirective extends Directive {
  frame = /(\w*):/;
  name = 'bind';
  init(node: RexNode): RexNode | RexNode[] {
    return node;
  }
  update(_value: string, _elems: HTMLElement[]): HTMLElement[] {
    throw new Error('Method not implemented.');
  }
}
