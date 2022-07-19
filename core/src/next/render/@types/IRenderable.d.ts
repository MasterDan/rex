import { RenderKind } from './RenderableType';
import { RenderResult } from './renderResult';
import { RenderResultGroup } from './RenderResultGroup';

export interface IRenderable {
  render(): RenderResult | RenderResultGroup;
  kind?: RenderKind;
}
