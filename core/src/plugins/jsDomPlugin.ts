import { RexPlugin } from './plugin';
import { JSDOM } from 'jsdom';
import { documentKey } from '../di/constants';

export class JsDomPlugin extends RexPlugin {
  constructor(private html: string) {
    super();
  }
  install(): void {
    const dom = new JSDOM(this.html);
    this.register(dom.window.document, documentKey);
  }
}
