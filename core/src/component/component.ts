import {
  BehaviorSubject,
  filter,
  forkJoin,
  map,
  take,
  withLatestFrom,
} from 'rxjs';
import { documentKey, htmlRootKey } from '../di/constants';
import { DependencyResolver } from '../di/dependencyResolver';
import { DiContainer } from '../di/diContainer';
import { HtmlElementProvider } from '../di/providers/htmlElementProvider';
import { Ref } from '../state/ref';
import { Scope } from '../state/scope';
import { RexNode, anchorAttribute } from '../domPrototype/rexNode';

export interface IComponentConstructorArgs {
  nodes: RexNode | null;
  setup(): Record<string, Ref>;
}

export class Component extends DependencyResolver {
  nodes = new RexNode('');
  _el$ = new BehaviorSubject<HTMLElement | null>(null);
  _mounted$ = new BehaviorSubject<boolean>(false);

  constructor(arg: IComponentConstructorArgs) {
    super();
    const state = arg.setup();
    if (arg.nodes != null) {
      this.nodes = arg.nodes;
    }
    this.container$
      .pipe(
        filter((v): v is DiContainer => v != null),
        take(1),
      )
      .subscribe((di) => {
        di.provideReactive(new Scope(state));
        this.nodes.setContainer(di);
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
      htmlText: this.nodes.text$,
    }).subscribe(({ element, htmlText }) => {
      element.innerHTML = htmlText;
      this._el$.next(element);
      this.nodes._mounted$.next(true);
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
      fragment: this.nodes.render(),
    }).subscribe(({ element, fragment }) => {
      element.appendChild(fragment);
      this._el$.next(element);
      this.nodes._mounted$.next(true);
      this._mounted$.next(true);
      this.container$
        .pipe(
          filter((di): di is DiContainer => di != null),
          take(1),
        )
        .subscribe((di) => {
          const state: Record<string, HTMLElement> = {};
          state[htmlRootKey] = element;
          di.provide(new HtmlElementProvider(state));
        });
    });
  }
}
