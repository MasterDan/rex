import { RexNode } from 'core/dist/types';
import { BehaviorSubject } from 'rxjs';
import { BehaviorMutable } from '../tools/rx/BehaviorMutable';
import { Directive } from './directive';

export class DirectivePipeline {
  private directives$ = new BehaviorMutable<Directive[] | null>(null);
  private initialNode$ = new BehaviorSubject<RexNode | null>(null);

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
}
