import { Ctor } from 'core/src/tools/types/ctor';
import { IRenderable } from '../@types/IRenderable';
import { RenderKind } from '../@types/RenderableType';

export function Dynamic(target: Ctor): Ctor {
  return {
    [target.name]: class extends (target as Ctor<IRenderable>) {
      kind = RenderKind.Dynamic;
    },
  }[target.name];
}
