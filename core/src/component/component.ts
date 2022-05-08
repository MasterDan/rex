import { filter, take } from 'rxjs';
import { DependencyResolver } from '../di/dependencyResolver';
import { DiContainer } from '../di/diContainer';
import { Ref } from '../scope/ref';
import { Scope } from '../scope/scope';
import { RexNode } from '../vdom/rexNode';

export interface IComponentConstructorArgs {
  template: RexNode;
  setup(): Record<string, Ref>;
}

export abstract class Component extends DependencyResolver {
  constructor(arg: IComponentConstructorArgs) {
    super();
    const state = arg.setup();
    this.container$
      .pipe(
        filter((v): v is DiContainer => v != null),
        take(1),
      )
      .subscribe((di) => {
        di.provideReactive(new Scope(state));
      });
    throw new Error('Not Implemented');
  }
}
