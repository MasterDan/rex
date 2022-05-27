import { RexNode } from 'core/src/vdom/rexNode';
import { Directive, IDirectiveBinding, IElems } from '../directive';

export class BindDirective extends Directive {
  frame = /(\w*):/;
  name = 'bind';

  init(
    node: RexNode,
    { argument, value }: IDirectiveBinding<string>,
  ): RexNode | RexNode[] {
    if (argument == null) {
      return node;
    }
    node.attributes$.mutate((attrs) => {
      if (attrs == null) {
        return {
          argument: value,
        };
      } else {
        attrs[argument] = value;
        return attrs;
      }
    });
    return node;
  }

  update(
    { element, elements }: IElems,
    { argument, value }: IDirectiveBinding<string>,
  ): HTMLElement[] {
    if (element == null || argument == null) {
      return elements;
    }
    element.setAttribute(argument, value ?? '');
    return elements;
  }
}
