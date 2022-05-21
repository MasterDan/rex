import {
  BehaviorSubject,
  filter,
  forkJoin,
  map,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';
import { documentKey } from '../di/constants';
import { DependencyResolver } from '../di/dependencyResolver';
import { DiContainer } from '../di/diContainer';
import { Ref } from '../scope/ref';
import { Scope } from '../scope/scope';
import { RexNode, updatableAttibute } from '../vdom/rexNode';

export interface IComponentConstructorArgs {
  render: RexNode | null;
  setup(): Record<string, Ref>;
}

export class Component extends DependencyResolver {
  render = new RexNode('');
  __selector = '';
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
    this._mounted$
      .pipe(
        filter((v) => v),
        switchMap(() => this.resolve<Document>(documentKey)),
        withLatestFrom(this.container$),
        filter((arr): arr is [Document, DiContainer] => arr[1] != null),
      )
      .subscribe(([doc, di]) => {
        doc
          .querySelectorAll(`${this.__selector} [${updatableAttibute}]`)
          .forEach((el) => {
            const attrVal = el.getAttribute(updatableAttibute);
            if (attrVal != null) {
              di.register(el, attrVal);
            }
          });
      });
  }

  _mounted$ = new BehaviorSubject<boolean>(false);

  mount(selector: string) {
    this.__selector = selector;
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
      this.render._mounted$.next(true);
      this._mounted$.next(true);
    });
  }
}
