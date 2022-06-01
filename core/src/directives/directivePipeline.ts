import { BehaviorSubject, combineLatest, filter, Observable, take } from 'rxjs';
import { BehaviorMutable } from '../tools/rx/BehaviorMutable';
import { RexNode } from '../domPrototype/rexNode';
import { Directive } from './directive';

export class DirectivePipeline {
  private directives$ = new BehaviorMutable<Directive[] | null>(null);
  private initialNode$ = new BehaviorSubject<RexNode | null>(null);
  private validState$: Observable<[Directive[], RexNode]> = combineLatest([
    this.directives$,
    this.initialNode$,
  ]).pipe(
    filter((arr): arr is [Directive[], RexNode] => {
      const [dirs, node] = arr;
      return dirs != null && node != null && dirs.length > 0;
    }),
  );
  private _transformedNodes$ = new BehaviorSubject<RexNode[] | null>(null);

  constructor() {
    this.validState$.subscribe(([directives, initialNode]) => {
      let transformationStep = directives[0].__applySafe(initialNode);
      for (let i = 1; i < directives.length; i++) {
        const currentDir = directives[i];
        const transformedNodes = transformationStep.map((node) => {
          const transformed = currentDir.__applySafe(node);
          return transformed;
        });
        transformationStep =
          transformedNodes.length > 0
            ? transformedNodes.reduce((a, c) => a.concat(c))
            : (transformedNodes as []);
      }
      this._transformedNodes$.next(transformationStep);
    });
  }

  get isEmpty(): boolean {
    const dirs = this.directives$.value;
    return dirs == null || dirs.length === 0;
  }

  setNode(n: RexNode): DirectivePipeline {
    this.initialNode$.next(n);
    return this;
  }

  pushDirectives(...dirs: Directive[]): DirectivePipeline {
    this.directives$.mutate((old) => {
      const newDirs = old ?? [];
      newDirs.push(...dirs);
      return newDirs;
    });
    return this;
  }

  get transformedNode$(): Observable<RexNode[]> {
    return this._transformedNodes$.pipe(
      filter((n): n is RexNode[] => n != null),
      take(1),
    );
  }
}
