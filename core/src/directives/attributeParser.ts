import { BehaviorSubject } from 'rxjs';
import { DependencyResolver } from '../di/dependencyResolver';

export class AttributePArser extends DependencyResolver {
  source: BehaviorSubject<string>;
  constructor(str: string) {
    super();
    this.source = new BehaviorSubject<string>(str);
  }
}
