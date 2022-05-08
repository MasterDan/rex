import { Component } from '../component/component';
import {
  directiveDetectorKey,
  documentKey,
  rootComponentKey,
} from '../di/constants';
import { DiContainer } from '../di/diContainer';
import { DirectiveDetector } from '../directives/directiveDetector';
import { RexPlugin } from '../plugins/plugin';

export function createApp(): RexApp {
  throw new Error('Not Implemented');
}

class RexApp {
  di = new DiContainer();
  constructor(root: Component) {
    this.di.register(root, rootComponentKey);
    this.di.register(DirectiveDetector, directiveDetectorKey);
    this.di.register(document, documentKey);
    throw new Error('Not Implemented');
  }

  extend(...plugins: RexPlugin[]): RexApp {
    this.di.provide(...plugins);
    return this;
  }

  mount(selector: string) {
    const component = this.di.resolve<Component>(rootComponentKey);
    if (component != null) {
      component.mount(selector);
    }
  }
}
