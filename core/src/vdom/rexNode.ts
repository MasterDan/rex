import {
  BehaviorSubject,
  combineLatest,
  first,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { DependencyResolver } from '../di/dependencyResolver';
import { Directive } from '../directives/directive';
import { BehaviorMutable } from '../tools/rx/BehaviorMutable';
import { isNullOrWhiteSpace } from '../tools/stringTools';

export type RexNodeChildren = RexNode | string | Array<string | RexNode> | null;

export class RexNode extends DependencyResolver {
  tag$: BehaviorSubject<string>;
  attributes$: BehaviorSubject<Record<string, string> | null>;
  children$: BehaviorMutable<RexNodeChildren>;

  directives$ = new BehaviorMutable<Directive[]>([]);

  constructor(
    tag: string,
    attributes: Record<string, string> | null = null,
    children: RexNodeChildren = null,
  ) {
    super();
    this.tag$ = new BehaviorSubject<string>(tag);
    this.attributes$ = new BehaviorSubject<Record<string, string> | null>(
      attributes,
    );
    this.children$ = new BehaviorMutable<RexNodeChildren>(children);
  }

  get text$(): Observable<string> {
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
          return children.text$;
        } else {
          return combineLatest(
            children.map((c) => (typeof c === 'string' ? of(c) : c.text$)),
          ).pipe(map((arr) => arr.join('')));
        }
      }),
    );
    const selfText$ = combineLatest([this.tag$, attrtext$, content$]).pipe(
      map(([tag, attrs, content]) => {
        return isNullOrWhiteSpace(tag)
          ? content
          : `<${tag} ${attrs} >${content}</${tag}>`;
      }),
    );
    return combineLatest([selfText$, this.directives$]).pipe(
      switchMap(([text, dirs]) => {
        if (dirs.length === 0) {
          return of(text);
        } else {
          let nodes: RexNode | RexNode[] | null = null;
          for (const dir of dirs) {
            if (nodes == null) {
              nodes = dir.init(this);
            } else if (nodes instanceof RexNode) {
              nodes = dir.init(nodes);
            } else {
              nodes = nodes
                .map((node) => {
                  const transformed = dir.init(node);
                  if (transformed instanceof RexNode) {
                    return [transformed];
                  } else return transformed;
                })
                .reduce((a, c) => a.concat(c));
            }
          }
          if (nodes instanceof RexNode) {
            return nodes.text$;
          } else {
            return combineLatest(nodes?.map((n) => n.text$) ?? []).pipe(
              map((arr) => arr.join('')),
            );
          }
        }
      }),
      first(),
    );
  }

  _addDirective(dir: Directive) {
    this.directives$.mutate((val) => {
      val.push(dir);
      return val;
    });
  }
}
