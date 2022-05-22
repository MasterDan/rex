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
import { HtmlElementProvider } from '../di/providers/htmlElementProvider';
import { Ref } from '../scope/ref';
import { Scope } from '../scope/scope';
import { RexNode, anchorAttribute } from '../vdom/rexNode';

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
    /* Search all anchor elements */
    this._mounted$
      .pipe(
        filter((v) => v),
        switchMap(() => this.resolve<Document>(documentKey)),
        withLatestFrom(this.container$),
        filter((arr): arr is [Document, DiContainer] => arr[1] != null),
      )
      .subscribe(([doc, di]) => {
        const elems = doc.querySelectorAll(
          `${this.__selector} [${anchorAttribute}]`,
        );
        const elemsRecord: Record<string, HTMLElement> = {};
        for (const el of elems) {
          const attrVal = el.getAttribute(anchorAttribute);
          if (attrVal != null) {
            elemsRecord[attrVal] = el as HTMLElement;
          }
        }
        di.provide(new HtmlElementProvider(elemsRecord));
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
