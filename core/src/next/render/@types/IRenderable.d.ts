import { ElementRole } from './ElementRole';
import { RenderKind } from './RenderableType';
import { RenderResult } from './renderResult';
import { RenderResultGroup } from './RenderResultGroup';

export interface IRenderable {
  render(): RenderResult | RenderResultGroup;
  kind?: RenderKind;
}

export interface IContainerBinding {
  parent?: Element;
  element: Element;
  role: ElementRole;
}
