import { RexNode } from '../../domPrototype/rexNode';
import { Directive } from '../directive';
import { IDirectiveBinding } from '../@types/IDirectiveBinding';
import { IElems } from '../@types/IElems';

export class BindDirective extends Directive {
  frame = /([\w-]*):$/;
  name = 'bind';

  init(
    node: RexNode,
    { argument, value }: IDirectiveBinding<string>,
  ): RexNode[] {
    if (argument == null) {
      return [node];
    }
    node.attributes$.mutate((old) => {
      const attrs = old ?? {};
      attrs[argument] = value;
      return attrs;
    });
    return [node];
  }

  update(
    { element, elements }: IElems,
    { argument, value }: IDirectiveBinding<string>,
  ): HTMLElement[] {
    if (element == null || argument == null) {
      return elements;
    }
    element.setAttribute(argument, value ?? '');
    return [element];
  }
}
