import { RexPlugin } from './plugin';
import { JSDOM } from 'jsdom';
import { documentKey } from '../di/constants';

export class JsDomPlugin extends RexPlugin {
  dom: JSDOM;
  constructor(private html: string) {
    super();
    this.dom = new JSDOM(this.html);
  }
  install(): void {
    this.register(this.dom.window.document, documentKey);
  }
}
