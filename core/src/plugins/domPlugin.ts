import { documentKey } from '../di/constants';
import { RexPlugin } from './plugin';

export class DomPlugin extends RexPlugin {
  install(): void {
    this.register(document, documentKey);
  }
}
