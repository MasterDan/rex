import { RexNode } from '../../domPrototype/rexNode';
import { IDirectiveBinding } from '../@types/IDirectiveBinding';
import { IElems } from '../@types/IElems';
import { Directive, IClassicDirectiveConfig } from '../directive';

export class BindDirective extends Directive {
  _frame = /([\w-]*):$/;
  name = 'bind';
  config: Partial<IClassicDirectiveConfig> = {
    init(node: RexNode, { argument, value }: IDirectiveBinding<string>) {
      if (argument == null) {
        return [node];
      }
      node.attributes$.mutate((old) => {
        const attrs = old ?? {};
        attrs[argument] = value;
        return attrs;
      });
    },
    update(
      { element, elements }: IElems,
      { argument, value }: IDirectiveBinding<string>,
    ) {
      if (element == null || argument == null) {
        return elements;
      }
      element.setAttribute(argument, value ?? '');
    },
  };
}
