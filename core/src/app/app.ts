import { Component } from '../component/component';
import { directiveDetectorKey, rootComponentKey } from '../di/constants';
import { DiContainer } from '../di/diContainer';
import { DirectiveDetector } from '../directives/directiveDetector';
import { RexPlugin } from '../plugins/plugin';

export function createApp(): RexApp {
  throw new Error('Not Implemented');
}

export class RexApp {
  di = new DiContainer();
  constructor(root: Component) {
    this.di.register(root, rootComponentKey);
    this.di.register(DirectiveDetector, directiveDetectorKey);
  }

  extend(...plugins: RexPlugin[]): RexApp {
    plugins.forEach((p) => {
      p.install();
    });
    this.di.provide(...plugins);
    return this;
  }

  mount(selector: string): RexApp {
    const component = this.di.resolve<Component>(rootComponentKey);
    if (component != null) {
      component.mount(selector);
    }
    return this;
  }
}
