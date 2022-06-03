import {
  BehaviorSubject,
  filter,
  forkJoin,
  map,
  take,
  withLatestFrom,
} from 'rxjs';
import { documentKey } from '../di/constants';
import { DependencyResolver } from '../di/dependencyResolver';
import { DiContainer } from '../di/diContainer';
import { HtmlElementProvider } from '../di/providers/htmlElementProvider';
import { Ref } from '../scope/ref';
import { Scope } from '../scope/scope';
import { RexNode, anchorAttribute } from '../domPrototype/rexNode';

export interface IComponentConstructorArgs {
  render: RexNode | null;
  setup(): Record<string, Ref>;
}

export class Component extends DependencyResolver {
  render = new RexNode('');
  _el$ = new BehaviorSubject<HTMLElement | null>(null);
  _mounted$ = new BehaviorSubject<boolean>(false);

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
  }

  mountAsText(selector: string) {
    /* search anchor elements if mounted as text */
    this._mounted$
      .pipe(
        filter((v) => v),
        withLatestFrom(this.container$, this._el$),
        filter(
          (arr): arr is [boolean, DiContainer, HTMLElement] =>
            arr[1] != null && arr[2] != null,
        ),
        take(1),
        map(([_, di, el]) => ({ di, el })),
      )
      .subscribe(({ di, el }) => {
        const elems = el.querySelectorAll(`[${anchorAttribute}]`);
        const elemsRecord: Record<string, HTMLElement> = {};
        for (const el of elems) {
          const attrVal = el.getAttribute(anchorAttribute);
          if (attrVal != null) {
            elemsRecord[attrVal] = el as HTMLElement;
          }
        }
        di.provide(new HtmlElementProvider(elemsRecord));
      });

    const element$ = this.resolve<Document>(documentKey).pipe(
      map((doc) => doc.querySelector(selector)),
      filter((el): el is HTMLElement => el != null),
      take(1),
    );

    forkJoin({
      element: element$,
      htmlText: this.render.text$,
    }).subscribe(({ element, htmlText }) => {
      element.innerHTML = htmlText;
      this._el$.next(element);
      this.render._mounted$.next(true);
      this._mounted$.next(true);
    });
  }

  mountUsingFragment(selector: string) {
    const element$ = this.resolve<Document>(documentKey).pipe(
      map((doc) => doc.querySelector(selector)),
      filter((el): el is HTMLElement => el != null),
      take(1),
    );
    forkJoin({
      element: element$,
      fragment: this.render.render(),
    }).subscribe(({ element, fragment }) => {
      element.appendChild(fragment);
      this._el$.next(element);
      this.render._mounted$.next(true);
      this._mounted$.next(true);
    });
  }
}
