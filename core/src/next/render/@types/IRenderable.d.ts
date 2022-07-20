import { RexarContainer } from '../containers/rexar-container';
import { ElementRole } from './ElementRole';
import { RenderKind } from './RenderableType';
import { RenderResult } from './renderResult';
import { RenderResultGroup } from './RenderResultGroup';

export interface IRenderable {
  render(): RenderResult | RenderResultGroup;
  kind?: RenderKind;
}

export interface IContainerTarget {
  bindContainer(container: RexarContainer): IContainerBinding;
}

export interface IContainerBinding {
  target(): IRenderTarget;
}

export interface IRenderTarget {
  parent?: Element;
  element: Element;
  role: ElementRole;
}
