export type RenderResult = Array<Element | string>;
export interface IRenderable {
  render(): RenderResult;
}
