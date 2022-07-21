import { ElementRole } from './ElementRole';
import { RenderKind } from './RenderableType';
import { RenderResult } from './renderResult';
import { RenderResultGroup } from './RenderResultGroup';

export interface IRenderable {
  render(): RenderResult | RenderResultGroup;
  kind?: RenderKind;
}

export type ContainerBinding =
  | {
      parent: Element;
      element: Element;
      role: ElementRole.NextSibling | ElementRole.PreviousSibling;
    }
  | {
      element: Element;
      role: ElementRole.Parent;
    };
