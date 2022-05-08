import { filter, take } from 'rxjs';
import { DependencyResolver } from '../di/dependencyResolver';
import { DiContainer } from '../di/diContainer';
import { Ref } from '../scope/ref';
import { Scope } from '../scope/scope';
import { RexNode } from '../vdom/rexNode';

export interface IComponentConstructorArgs {
  render: RexNode | null;
  setup(): Record<string, Ref>;
}

export class Component extends DependencyResolver {
  render = new RexNode('');
  constructor(arg: IComponentConstructorArgs) {
    super();
    const state = arg.setup();
    if (arg.render != null) {
      this.render = arg.render;
    }
    this.container$
      .pipe(
        filter((v): v is DiContainer => v != null),
        take(1),
      )
      .subscribe((di) => {
        di.provideReactive(new Scope(state));
        this.render.setContainer(di);
      });
    throw new Error('Not Implemented');
  }

  mount(selector: string) {
    console.log(selector);

    throw new Error('Not Implemented');
  }
}
