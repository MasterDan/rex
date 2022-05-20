import { filter, forkJoin, map, take } from 'rxjs';
import { documentKey } from '../di/constants';
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
  }

  mount(selector: string) {
    const element$ = this.resolve<Document>(documentKey).pipe(
      map((doc) => doc.querySelector(selector)),
      filter((el): el is Element => el != null),
      take(1),
    );
    forkJoin({
      element: element$,
      htmlText: this.render.text$,
    }).subscribe(({ element, htmlText }) => {
      element.innerHTML = htmlText;
    });
  }
}
