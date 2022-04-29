import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  of,
  switchMap,
} from 'rxjs';
import { BehaviorMutable } from '../tools/BehaviorMutable';

export type RexNodeChildren = RexNode | RexNode[] | string | string[] | null;

export class RexNode {
  tag$: BehaviorSubject<string>;
  attributes$: BehaviorSubject<Record<string, string> | null>;
  children$: BehaviorMutable<RexNodeChildren>;

  text$ = new BehaviorSubject<string | null>(null);

  constructor(
    tag: string,
    attributes: Record<string, string> | null = null,
    children: RexNodeChildren = null,
  ) {
    this.tag$ = new BehaviorSubject<string>(tag);
    this.attributes$ = new BehaviorSubject<Record<string, string> | null>(
      attributes,
    );
    this.children$ = new BehaviorMutable<RexNodeChildren>(children);

    const attrtext$ = this.attributes$.pipe(
      map((attrs) => {
        if (attrs == null) {
          return '';
        }
        return Object.keys(attrs)
          .map((key) => `${key}="${attrs[key]}"`)
          .join(' ');
      }),
    );
    const content$ = this.children$.pipe(
      switchMap((children) => {
        if (children == null) {
          return of('');
        } else if (typeof children === 'string') {
          return of(children);
        } else if (children instanceof RexNode) {
          return children.text$.pipe(filter((t): t is string => t != null));
        } else {
          return combineLatest(
            children.map((c) =>
              typeof c === 'string'
                ? of(c)
                : c.text$.pipe(filter((t): t is string => t != null)),
            ),
          ).pipe(map((arr) => arr.join('')));
        }
      }),
    );
    combineLatest([this.tag$, attrtext$, content$])
      .pipe(
        map(([tag, attrs, content]) => {
          return `<${tag} ${attrs} >${content}</${tag}>`;
        }),
      )
      .subscribe((text) => this.text$.next(text));
  }
}
