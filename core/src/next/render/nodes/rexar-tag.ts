import { IRenderable } from '../@types/IRenderable';
import { Resolvable } from '../../di/resolvable.decorator';
import { documentKey } from '../../../di/constants';
import { diContainer } from '../../di/di-container';

type Attributes = Record<string, string | null> | null;
export class RexarTag implements IRenderable {
  constructor(public name: string, public attibutes: Attributes = null) {}

  render(): Element {
    const renderer = diContainer.resolve(RexarTagRenderer);
    if (renderer == null) {
      throw new Error('Tag renderer not been resolved properly');
    }
    return renderer.render(this);
  }
}

@Resolvable({ dependencies: [documentKey] })
class RexarTagRenderer {
  constructor(private doc: Document) {}

  render(tag: RexarTag): Element {
    const element = this.doc.createElement(tag.name);
    if (tag.attibutes != null) {
      for (const key in tag.attibutes) {
        element.setAttribute(key, tag.attibutes[key] ?? '');
      }
    }
    return element;
  }
}
