import { BehaviorSubject, filter, switchMap } from 'rxjs';
import { DependencyResolver } from '../di/dependencyResolver';
import { RexNode } from '../vdom/rexNode';

export class DirectiveDetector extends DependencyResolver {
  sourceNode$: BehaviorSubject<RexNode>;
  constructor(node: RexNode) {
    super();
    this.sourceNode$ = new BehaviorSubject<RexNode>(node);

    this.sourceNode$.pipe(
      switchMap((node) => node.children$),
      filter(
        (children): children is string =>
          children != null && typeof children === 'string',
      ),
    );
  }
}
