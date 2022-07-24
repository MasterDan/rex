import { IRenderable } from '../@types/IRenderable';
import { RenderResultGroup } from '../@types/RenderResultGroup';
import { Static } from '../decorators/static.decorator';

@Static
export class RexarTemplate implements IRenderable {
  private template: IRenderable[];

  constructor(...parts: IRenderable[]) {
    this.template = parts;
  }

  render(): RenderResultGroup {
    const render: RenderResultGroup = [];
    this.template
      .map((i) => i.render())
      .forEach((i) => {
        if (Array.isArray(i)) {
          for (const item of i) {
            render.push(item);
          }
        } else {
          render.push(i);
        }
      });
    return render;
  }
}
