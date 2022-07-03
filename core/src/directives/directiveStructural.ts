import { RexNode } from '../domPrototype/rexNode';
import { DirectiveType } from './@types/DirectiveType';
import { IDirectiveBinding } from './@types/IDirectiveBinding';
import { ElemsWithNode } from './@types/IElems';
import { DirectiveBase, DirectiveTransformResult } from './directiveBase';

export interface IStructuralDirectiveConfig<T = string> {
  init(node: RexNode, binding: IDirectiveBinding<T>): RexNode[];
  update(
    elems: ElemsWithNode,
    binding: IDirectiveBinding<T>,
  ): DirectiveTransformResult;
  mounted(
    elems: ElemsWithNode,
    binding: IDirectiveBinding<T>,
  ): DirectiveTransformResult;
}

export abstract class DirectiveStructural<T = string> extends DirectiveBase<T> {
  abstract name: string;
  type: DirectiveType = DirectiveType.Structural;
  abstract config: Partial<IStructuralDirectiveConfig<T>>;
  init(node: RexNode, binding: IDirectiveBinding<T>): RexNode[] {
    if (this.config.init) {
      return this.config.init(node, binding);
    } else {
      return [node];
    }
  }
  update(
    elems: ElemsWithNode,
    binding: IDirectiveBinding<T>,
  ): DirectiveTransformResult {
    if (this.config.update) {
      return this.config.update(elems, binding);
    } else {
      return elems.elements;
    }
  }
  protected override mounted(
    elems: ElemsWithNode,
    binding: IDirectiveBinding<T>,
  ): DirectiveTransformResult {
    if (this.config.mounted) {
      return this.config.mounted(elems, binding);
    } else if (this.config.update) {
      return this.config.update(elems, binding);
    } else {
      return elems.elements;
    }
  }
}
