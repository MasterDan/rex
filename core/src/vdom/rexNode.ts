import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
  take,
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
import { pipeIt } from '../tools/pipe';

export type RexNodeChildren = RexNode | string | Array<string | RexNode> | null;

export const updatableAttibute = 'rex-node-updatable';

export const rexNodeIdPrefix = '__rex-node-';

export interface IRexNodeOptions {
  skipDirectivesResolve: boolean;
}

export class RexNode extends DependencyResolver {
  tag$: BehaviorSubject<string>;

  attributes$: BehaviorMutable<Record<string, string | null> | null>;
  children$: BehaviorMutable<RexNodeChildren>;
  directives$ = new BehaviorMutable<Directive[]>([]);

  _updatable$ = new BehaviorSubject<boolean>(false);
  _id$ = new BehaviorSubject<string | null>(null);
  _mounted$ = new BehaviorSubject<boolean>(false);

  _parentNode$ = new BehaviorSubject<RexNode | null>(null);

  constructor(
    tag = '',
    attributes: Record<string, string | null> | null = null,
    children: RexNodeChildren = null,
    options: IRexNodeOptions | null = null,
  ) {
    super();
    this.tag$ = new BehaviorSubject<string>(tag);
    this.attributes$ = new BehaviorMutable<Record<
      string,
      string | null
    > | null>(attributes);
    /* setting children with little transormations */
    this.children$ = pipeIt(this.__simplifyChildren__)
      .then(this.__simplifyArray__)
      .then((result) => new BehaviorMutable<RexNodeChildren>(result))
      .run(children);
    /* mark yourself unique attribute to easier detect later */
    this._updatable$
      .pipe(
        filter((val) => val == true),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.attributes$.mutate((oldval) => {
          if (this._id$.value == null) {
            this._id$.next(newId(rexNodeIdPrefix));
          }
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

    /* Set current node as parent to children */
    this.children$.subscribe((children) => {
      if (children instanceof RexNode) {
        children._parentNode$.next(this);
      } else if (Array.isArray(children)) {
        children
          .filter((child): child is RexNode => child instanceof RexNode)
          .forEach((child) => {
            child._parentNode$.next(this);
          });
      }
    });
    /* Providing mounted state to children */
    this._mounted$
      .pipe(
        filter((val) => val),
        switchMap(() => this.children$),
      )
      .subscribe(() => {
        if (children instanceof RexNode) {
          children._mounted$.next(true);
        } else if (Array.isArray(children)) {
          children
            .filter((child): child is RexNode => child instanceof RexNode)
            .forEach((child) => {
              child._mounted$.next(true);
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
    if (options == null || !options.skipDirectivesResolve) {
      /* searching for directives in node */
      this.resolve<DirectiveDetector>(directiveDetectorKey).subscribe(
        (detector) => {
          detector.findStringTemplates(this);
        },
      );
    }
  }
  /** Concat multiple strings into one  */
  private __simplifyChildren__(children: RexNodeChildren): RexNodeChildren {
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
  private __simplifyArray__(children: RexNodeChildren): RexNodeChildren {
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
    const noninitDirectives = this.directives$.value.filter(
      (d) => d.__initialized === false,
    );
    if (noninitDirectives.length === 0) {
      /* Current node doesn't nedd transformation therefore we can render it */
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
            : `<${tag} ${attrs}>${content}</${tag}>`;
        }),
        take(1),
      );
      return selfText$;
    } else {
      /* Current node needs transformation before drawing */
      let nodes: RexNode | RexNode[] | null = null;
      /* Applying directives. 
      They will transform current node into one or many nodes. */
      for (const key in noninitDirectives) {
        const directive: Directive = this.directives$.value[key];
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
  }

  clone(options: IRexNodeOptions | null = null): RexNode {
    const clonedNode = new RexNode(
      this.tag$.value,
      this.attributes$.value,
      this.children$.value,
      options,
    );
    this.container$
      .pipe(
        filter((di): di is DiContainer => di != null),
        take(1),
      )
      .subscribe((di) => {
        clonedNode.setContainer(di);
      });
    clonedNode._id$.next(this._id$.value);
    return clonedNode;
  }

  __addDirective(dir: Directive) {
    this.directives$.mutate((val) => {
      val.push(dir);
      return val;
    });
  }
}
