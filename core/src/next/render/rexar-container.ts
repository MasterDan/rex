import { IRenderable } from './@types/IRenderable';
import { RenderResult } from './@types/renderResult';
import { RenderResultGroup } from './@types/RenderResultGroup';

export class RexarContainer implements IRenderable {
  render(): RenderResult | RenderResultGroup {
    throw new Error('Method not implemented.');
  }
}
