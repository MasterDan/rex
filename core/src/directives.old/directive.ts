import { RexNode } from '../domPrototype/rexNode';
import { DirectiveType } from './@types/DirectiveType';
import { IDirectiveBinding } from './@types/IDirectiveBinding';
import { ElemsWithNode, IElems } from './@types/IElems';
import { DirectiveBase, DirectiveTransformResult } from './directiveBase';

export interface IClassicDirectiveConfig<T = string> {
  init(node: RexNode, binding: IDirectiveBinding<T>): void;
  update(elems: IElems, binding: IDirectiveBinding<T>): void;
  mounted(elems: IElems, binding: IDirectiveBinding<T>): void;
}

export abstract class Directive<T = string> extends DirectiveBase<T> {
  abstract config: Partial<IClassicDirectiveConfig<T>>;

  _type = DirectiveType.Classic;

  init(node: RexNode, binding: IDirectiveBinding<T>): RexNode[] {
    if (this.config.init) {
      this.config.init(node, binding);
    }
    return [node];
  }

  update(
    elems: ElemsWithNode,
    binding: IDirectiveBinding<T>,
  ): DirectiveTransformResult {
    if (this.config.update) {
      this.config.update(elems, binding);
    }
    return elems.elements;
  }

  protected override mounted(
    elems: ElemsWithNode,
    binding: IDirectiveBinding<T>,
  ): DirectiveTransformResult {
    if (this.config.mounted) {
      this.config.mounted(elems, binding);
    } else if (this.config.update) {
      this.config.update(elems, binding);
    }
    return elems.elements;
  }
}
