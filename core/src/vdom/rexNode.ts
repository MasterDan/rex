import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { directiveDetectorKey } from '../di/constants';
import { DependencyResolver } from '../di/dependencyResolver';
import { DiContainer } from '../di/diContainer';
import { Directive } from '../directives/directive';
import { DirectiveDetector } from '../directives/directiveDetector';
import { BehaviorMutable } from '../tools/rx/BehaviorMutable';
import { isNullOrWhiteSpace } from '../tools/stringTools';

export type RexNodeChildren = RexNode | string | Array<string | RexNode> | null;

export class RexNode extends DependencyResolver {
  tag$: BehaviorSubject<string>;

  attributes$: BehaviorMutable<Record<string, string> | null>;

  children$: BehaviorMutable<RexNodeChildren>;

  _updatable = new BehaviorSubject<boolean>(false);

  directives$ = new BehaviorMutable<Directive[]>([]);

  parentNode$ = new BehaviorSubject<RexNode | null>(null);

  constructor(
    tag = '',
    attributes: Record<string, string> | null = null,
    children: RexNodeChildren = null,
  ) {
    super();
    this.tag$ = new BehaviorSubject<string>(tag);
    this.attributes$ = new BehaviorMutable<Record<string, string> | null>(
      attributes,
    );
    this.children$ = new BehaviorMutable<RexNodeChildren>(
      this.simplifyArray(this.simplifyChildren(children)),
    );
    this.children$.subscribe((children) => {
      if (children instanceof RexNode) {
        children.parentNode$.next(this);
      } else if (Array.isArray(children)) {
        children
          .filter((child): child is RexNode => child instanceof RexNode)
          .forEach((child) => {
            child.parentNode$.next(this);
          });
      }
    });
    combineLatest([this.container$, this.children$])
      .pipe(
        filter((arr): arr is [DiContainer, RexNodeChildren] => {
          const [di] = arr;
          return di != null;
        }),
      )
      .subscribe(([di, children]) => {
        if (children instanceof RexNode) {
          children.setContainer(di);
        } else if (Array.isArray(children)) {
          children
            .filter((child): child is RexNode => child instanceof RexNode)
            .forEach((child) => {
              child.setContainer(di);
            });
        }
      });

    this.resolve<DirectiveDetector>(directiveDetectorKey).subscribe(
      (detector) => {
        detector.findStringTemplates(this);
      },
    );
  }

  private simplifyChildren(children: RexNodeChildren): RexNodeChildren {
    if (children == null || !Array.isArray(children) || children.length < 2) {
      return children;
    }

    const childrenToReturn: RexNodeChildren = [];
    let touchedString = false;
    let childToPush = null;
    for (const child of children) {
      if (typeof child === 'string') {
        if (!touchedString) {
          touchedString = true;
          childToPush = child;
        } else {
          (childToPush as string) += child;
        }
      } else {
        if (childToPush != null) {
          childrenToReturn.push(childToPush);
          childToPush = null;
          touchedString = false;
        }
        childrenToReturn.push(child);
      }
    }
    if (childToPush != null) {
      childrenToReturn.push(childToPush);
    }
    return childrenToReturn;
  }

  private simplifyArray(children: RexNodeChildren): RexNodeChildren {
    if (children == null) {
      return children;
    } else if (Array.isArray(children) && children.length === 1) {
      return children[0];
    } else {
      return children;
    }
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
        const noninitDirectives = dirs.filter((d) => !d._initialized);
        if (noninitDirectives.length === 0) {
          return of(text);
        } else {
          let nodes: RexNode | RexNode[] | null = null;
          for (const key in noninitDirectives) {
            const directive: Directive = dirs[key];
            if (nodes == null) {
              nodes = directive.__apply(this);
            } else if (nodes instanceof RexNode) {
              nodes = directive.__apply(nodes);
            } else {
              nodes = nodes
                .map((node) => {
                  const transformed = directive.__apply(node);
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
      take(1),
    );
  }

  _addDirective(dir: Directive) {
    this.directives$.mutate((val) => {
      val.push(dir);
      return val;
    });
  }
}
