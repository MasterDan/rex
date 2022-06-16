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
import {
  directiveDetectorKey,
  documentKey,
  htmlElementsKey,
  htmlRootKey,
} from '../di/constants';
import { DependencyResolver } from '../di/dependencyResolver';
import type { DiContainer } from '../di/diContainer';
import type { Directive } from '../directives/directive';
import type { DirectiveDetector } from '../directives/directiveDetector';
import { BehaviorMutable } from '../tools/rx/BehaviorMutable';
import { isNullOrWhiteSpace } from '../tools/stringTools';
import { newId } from '../tools/idGeneratorSimple';
import { pipeIt } from '../tools/pipe';
import { DirectivePipeline } from '../directives/directivePipeline';
import { HtmlElementProvider } from '../di/providers/htmlElementProvider';
import { DiContainerReactive } from '../di/diContainerReactive';

export type RexNodeChildren = Array<string | RexNode> | null;

export const anchorAttribute = '__rex__anchor';

export const anchorPrefix = 'anchor--';

export interface IRexNodeOptions {
  skipDirectivesResolve: boolean;
}

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
      : this.directives.transformedNodes$;
  }

  /** html elememt ( if current node is updatable ) */
  _htmlElement$: Observable<HTMLElement> = this._id$.pipe(
    filter((id): id is string => id != null),
    switchMap((id) =>
      this.resolve<DiContainerReactive>(htmlElementsKey).pipe(
        switchMap((htmlDi) => htmlDi.resolveReactive<HTMLElement>(id)),
        filter((el): el is HTMLElement => el != null),
      ),
    ),
  );

  _rootElement$: Observable<HTMLElement> = this.resolve<DiContainerReactive>(
    htmlElementsKey,
  ).pipe(
    switchMap((htmlDi) => htmlDi.resolveReactive<HTMLElement>(htmlRootKey)),
    filter((el): el is HTMLElement => el != null),
  );

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
    /* we need unique id if we're planning to update current node in runtime */
    combineLatest([this._updatable$, this._id$.pipe(distinctUntilChanged())])
      .pipe(filter(([needsUpdate, id]) => needsUpdate == true && id == null))
      .subscribe(() => {
        this._id$.next(newId(anchorPrefix));
      });
    /* passing id to the attributes if we have */
    this._id$.pipe(filter((id): id is string => id != null)).subscribe((id) => {
      this.attributes$.mutate((oldval) => {
        const attributes = oldval ?? {};
        attributes[anchorAttribute] = id;
        return attributes;
      });
    });

    /* Set current node as parent to children */
    this.children$
      .pipe(filter((c): c is Array<string | RexNode> => c != null))
      .subscribe((children) => {
        children
          .filter((child): child is RexNode => child instanceof RexNode)
          .forEach((child) => {
            child._parentNode$.next(this);
          });
      });
    /* updating position of our children */
    this.children$
      .pipe(
        filter((c): c is Array<string | RexNode> => c != null),
        switchMap((children) =>
          combineLatest(
            children.map((child, index) => {
              if (typeof child === 'string') {
                return of({
                  index,
                  size: 1,
                });
              } else {
                return child.directives.size$.pipe(
                  map((size) => ({
                    index,
                    size,
                  })),
                );
              }
            }),
          ),
        ),
      )
      .subscribe((sizes: { size: number; index: number }[]) => {
        const children = this.children$.value ?? [];
        let currentPosition = 0;
        for (const item of sizes) {
          const child = children[item.index];
          if (child instanceof RexNode) {
            child.directives.positionInParenNode$.next(currentPosition);
            currentPosition += item.size;
          } else {
            currentPosition++;
          }
        }
      });

    /* Providing mounted state to children */
    this._mounted$
      .pipe(
        filter((val) => val),
        switchMap(() => this._selfOrTransformed$),
      )
      .subscribe((sot) => {
        for (const node of sot) {
          node._mounted$.next(true);
        }
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

    /* Providing unmounted state to children */
    this._mounted$
      .pipe(
        filter((val) => !val),
        switchMap(() => this._selfOrTransformed$),
      )
      .subscribe((sot) => {
        for (const node of sot) {
          node._mounted$.next(false);
        }
        if (children instanceof RexNode) {
          children._mounted$.next(false);
        } else if (Array.isArray(children)) {
          children
            .filter((child): child is RexNode => child instanceof RexNode)
            .forEach((child) => {
              child._mounted$.next(false);
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

  /** Returns text of current non-transformed rex-node */
  __renderAsText(node: RexNode): Observable<string> {
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

  private __insertInto(appendHere: DocumentFragment | HTMLElement) {
    combineLatest([
      this.resolve<Document>(documentKey),
      this._selfOrTransformed$,
    ])
      .pipe(take(1))
      .subscribe(([doc, nodes]) => {
        for (const node of nodes) {
          if (isNullOrWhiteSpace(node.tag$.value)) {
            if (node.children$.value != null) {
              for (const child of node.children$.value) {
                if (typeof child === 'string') {
                  appendHere.append(child);
                } else {
                  child.__insertInto(appendHere);
                }
              }
            }
          } else {
            const el = doc.createElement(node.tag$.value);
            if (node.attributes$.value != null) {
              for (const key of Object.keys(node.attributes$.value)) {
                // console.log(
                //   'setting attribute',
                //   key,
                //   node.attributes$.value[key],
                // );
                el.setAttribute(key, node.attributes$.value[key] ?? '');
              }
            }
            // console.log('all attributes set');
            if (node.children$.value != null) {
              for (const child of node.children$.value) {
                if (typeof child === 'string') {
                  // console.log('adding child', child);
                  el.append(child);
                } else {
                  // console.log('adding child', child.toString());
                  child.__insertInto(el);
                }
              }
            }
            /* providing self in Di before mount */
            combineLatest([this.container$, node._id$])
              .pipe(
                filter((args): args is [DiContainer, string] =>
                  args.every((e) => e != null),
                ),
                take(1),
              )
              .subscribe(([di, id]) => {
                const provideArg: Record<string, HTMLElement> = {};
                provideArg[id] = el;
                // console.log('providing element', el);
                di.provide(new HtmlElementProvider(provideArg));
              });
            // console.log(
            //   'appending element',
            //   el,
            //   this.container$.value,
            //   this._id$.value,
            //   this.directives.isEmpty,
            // );
            appendHere.appendChild(el);
          }
        }
      });
  }

  /** Creates Document fragment and renders node into it as Observable */
  render(): Observable<DocumentFragment> {
    const fragment$ = this.resolve<Document>(documentKey).pipe(
      map((doc) => doc.createDocumentFragment()),
    );
    return combineLatest([fragment$, this._selfOrTransformed$]).pipe(
      map(([fragment, nodes]) => {
        for (const node of nodes) {
          node.__insertInto(fragment);
        }
        return fragment;
      }),
    );
  }

  /** Making copy of current node */
  clone(options: IRexNodeOptions | null = null): RexNode {
    const clonedNode = new RexNode(
      this.tag$.value,
      this.attributes$.value,
      this.children$.value?.map((node) =>
        typeof node === 'string' ? node : node.clone(),
      ),
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
      this.children$.value?.length === other.children$.value?.length
    );
  }

  __addDirective(...dirs: Directive[]) {
    this.directives.pushDirectives(...dirs);
  }

  override toString(): string {
    let output = '';
    this.text$.pipe(take(1)).subscribe((val) => (output = val));
    return output;
  }
}
