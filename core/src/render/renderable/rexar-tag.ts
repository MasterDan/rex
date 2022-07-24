import { IRenderable } from '../@types/IRenderable';
import { Static } from '../decorators/static.decorator';
import { resolve } from '../../di/di-container';
import { documentKey } from '@/constants';

export type Attributes = Record<string, string | null> | null;
@Static
export class RexarTag implements IRenderable {
  document = resolve<Document>(documentKey);

  constructor(public name: string, public attibutes: Attributes = null) {}

  render(): Element {
    const element = this.document.createElement(this.name);
    if (this.attibutes != null) {
      for (const key in this.attibutes) {
        element.setAttribute(key, this.attibutes[key] ?? '');
      }
    }
    return element;
  }
}
