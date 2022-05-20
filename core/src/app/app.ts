import { Component } from '../component/component';
import { directiveDetectorKey, rootComponentKey } from '../di/constants';
import { DiContainer } from '../di/diContainer';
import { TemplateStringDirective } from '../directives/builtin/templateStringDirective';
import { DirectiveDetector } from '../directives/directiveDetector';
import { DirectiveProvider } from '../directives/directiveProvider';
import { DomPlugin } from '../plugins/domPlugin';
import { RexPlugin } from '../plugins/plugin';

export function createApp(root: Component): RexApp {
  return new RexApp(root).extend(new DomPlugin());
}

export class RexApp {
  di = new DiContainer();
  constructor(root: Component) {
    this.di.register(root, rootComponentKey);
    this.di.register(DirectiveDetector, directiveDetectorKey);
    this.di.provide(new DirectiveProvider(TemplateStringDirective));
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
