import { ElementRole } from './ElementRole';
import { RenderKind } from './RenderableType';
import { RenderResult } from './renderResult';
import { RenderResultGroup } from './RenderResultGroup';

export interface IRenderable {
  render(): RenderResult | RenderResultGroup;
  kind?: RenderKind;
}

export interface INextOrPreviousBinding {
  parent: Element;
  element: Element;
  role: ElementRole.NextSibling | ElementRole.PreviousSibling;
}

export interface IParentBinding {
  element: Element;
  role: ElementRole.Parent;
}

export type ContainerBinding = INextOrPreviousBinding | IParentBinding;
