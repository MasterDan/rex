import { ElementRole } from './ElementRole';
import { RenderKind } from './RenderableType';
import { RenderResult } from './renderResult';
import { RenderResultGroup } from './RenderResultGroup';

export interface IRenderable {
  render(): RenderResult | RenderResultGroup;
  kind?: RenderKind;
}

export type BindingTarget = Element | DocumentFragment;

export interface INextOrPreviousBinding {
  parent: BindingTarget;
  element: BindingTarget;
  role: ElementRole.NextSibling | ElementRole.PreviousSibling;
}

export interface IParentBinding {
  element: BindingTarget;
  role: ElementRole.Parent;
}

export type ContainerBinding = INextOrPreviousBinding | IParentBinding;
