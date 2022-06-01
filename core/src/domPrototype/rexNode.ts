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
import { DirectivePipeline } from '../directives/directivePipeline';

export type RexNodeChildren = Array<string | RexNode> | null;

export const anchorAttribute = '--rex--anchor';

export const anchorPrefix = 'anchor--';

export interface IRexNodeOptions {
  skipDirectivesResolve: boolean;
}
/**
 * @todo make pipeline of directives
 * @todo call pipeline before render
 * @todo option to render DocumentFragment https://davidwalsh.name/documentfragment
 */
export class RexNode extends DependencyResolver {
  tag$: BehaviorSubject<string>;

  attributes$: BehaviorMutable<Record<string, string | null> | null>;

  children$: BehaviorMutable<RexNodeChildren>;

  directives = new DirectivePipeline().setNode(this);

  _updatable$ = new BehaviorSubject<boolean>(false);

  _id$ = new BehaviorSubject<string | null>(null);

  _mounted$ = new BehaviorSubject<boolean>(false);

  _parentNode$ = new BehaviorSubject<RexNode | null>(null);

  get _selfOrTransformed$(): Observable<RexNode[]> {
    return this.directives.isEmpty
      ? of([this])
      : this.directives.transformedNode$;
  }

  constructor(
    tag = '',
    attributes: Record<string, string | null> | null = null,
    children: RexNodeChildren | RexNode | string = null,
    options: IRexNodeOptions | null = null,
  ) {
    super();
    this.tag$ = new BehaviorSubject<string>(tag);
    this.attributes$ = new BehaviorMutable<Record<
      string,
      string | null
    > | null>(attributes);
    /* setting children with little transormations */
    this.children$ = pipeIt(() =>
      children == null || Array.isArray(children) ? children : [children],
    )
      .then(this.__simplifyChildren__)
      .then((result) => new BehaviorMutable<RexNodeChildren>(result))
      .run();
    /* mark yourself unique attribute to easier detect later */
    this._updatable$
      .pipe(
        filter((val) => val == true),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.attributes$.mutate((oldval) => {
          if (this._id$.value == null) {
            this._id$.next(newId(anchorPrefix));
          }
          if (oldval != null) {
            oldval[anchorAttribute] = this._id$.value;
            return oldval;
          } else {
            const attributes = {} as Record<string, string | null>;
            attributes[anchorAttribute] = this._id$.value;
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
    /* searching for directives in node if not restricted in options */
    if (options == null || !options.skipDirectivesResolve) {
      this.resolve<DirectiveDetector>(directiveDetectorKey).subscribe(
        (detector) => {
          detector.scanNode(this);
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

  __renderAsText(node: RexNode): Observable<string> {
    /* Current node doesn't nedd transformation therefore we can render it */
    const attrtext$ = node.attributes$.pipe(
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
    const content$ = node.children$.pipe(
      switchMap((children) => {
        if (children == null) {
          return of('');
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
  }

  /** returns html text of current node */
  get text$(): Observable<string> {
    return this._selfOrTransformed$.pipe(
      switchMap((nodes) =>
        combineLatest(nodes.map((node) => this.__renderAsText(node))),
      ),
      map((strings) => {
        return strings.join('');
      }),
    );
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

  compare(other: RexNode): boolean {
    return (
      this.tag$.value === other.tag$.value &&
      this.children$.value?.length === other.children$.value?.length &&
      this.attributes$.value?.length === other.attributes$.value?.length
    );
  }

  __addDirective(...dirs: Directive[]) {
    this.directives.pushDirectives(...dirs);
  }
}