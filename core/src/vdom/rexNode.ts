import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';
import type { Observable } from 'rxjs';
import { directiveDetectorKey } from '../di/constants';
import { DependencyResolver } from '../di/dependencyResolver';
import type { DiContainer } from '../di/diContainer';
import type { Directive } from '../directives/directive';
import type { DirectiveDetector } from '../directives/directiveDetector';
import { BehaviorMutable } from '../tools/rx/BehaviorMutable';
import { isNullOrWhiteSpace } from '../tools/stringTools';
import { newId } from '../tools/idGeneratorSimple';

export type RexNodeChildren = RexNode | string | Array<string | RexNode> | null;

const updatableAttibute = 'rex-node-updatable';

export class RexNode extends DependencyResolver {
  tag$: BehaviorSubject<string>;

  attributes$: BehaviorMutable<Record<string, string | null> | null>;

  children$: BehaviorMutable<RexNodeChildren>;

  _updatable$ = new BehaviorSubject<boolean>(false);

  _id$ = new BehaviorSubject<string | null>(null);

  directives$ = new BehaviorMutable<Directive[]>([]);

  parentNode$ = new BehaviorSubject<RexNode | null>(null);

  constructor(
    tag = '',
    attributes: Record<string, string | null> | null = null,
    children: RexNodeChildren = null,
  ) {
    super();
    this.tag$ = new BehaviorSubject<string>(tag);
    this.attributes$ = new BehaviorMutable<Record<
      string,
      string | null
    > | null>(attributes);
    this.children$ = new BehaviorMutable<RexNodeChildren>(
      this.simplifyArray(this.simplifyChildren(children)),
    );
    /* mark yourself unique attribute to easier detect later */
    this._updatable$
      .pipe(
        filter((val) => val == true),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.attributes$.mutate((oldval) => {
          this._id$.next(newId('x'));
          if (oldval != null) {
            oldval[updatableAttibute] = this._id$.value;
            return oldval;
          } else {
            const attributes = {} as Record<string, string | null>;
            attributes[updatableAttibute] = this._id$.value;
            return attributes;
          }
        });
      });

    this._id$
      .pipe(
        filter((id) => id != null),
        withLatestFrom(this.text$),
      )
      .subscribe(([id, text]) => {
        console.log('id ', id);
        console.log('fullNode ', text);
      });

    /* Set current node as parent to children */
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
    /* Providing di container to all children */
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
  /** Concat multiple strings into one  */
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

  /** Replace array of one item with it's content */
  private simplifyArray(children: RexNodeChildren): RexNodeChildren {
    if (children == null) {
      return children;
    } else if (Array.isArray(children) && children.length === 1) {
      return children[0];
    } else {
      return children;
    }
  }

  /** returns html text of current node */
  get text$(): Observable<string> {
    const attrtext$ = this.attributes$.pipe(
      map((attrs) => {
        if (attrs == null) {
          return '';
        }
        return Object.keys(attrs)
          .map((key) => (attrs[key] != null ? `${key}="${attrs[key]}"` : key))
          .join(' ');
      }),
    );
    /* draws content as it is */
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
    /* Text of current node without directive transformations */
    const selfText$ = combineLatest([this.tag$, attrtext$, content$]).pipe(
      map(([tag, attrs, content]) => {
        return isNullOrWhiteSpace(tag)
          ? content
          : `<${tag} ${attrs} >${content}</${tag}>`;
      }),
    );
    /* Applying directives if they exists. 
    They will transform current node into one or many nodes. */
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
