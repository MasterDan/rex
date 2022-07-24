import { IRenderable } from '../@types/IRenderable';
import { Static } from '../decorators/static.decorator';

@Static
export class RexarString implements IRenderable {
  constructor(private body: string) {}

  render(): string {
    return this.body;
  }
}
