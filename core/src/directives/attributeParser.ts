import { BehaviorSubject } from 'rxjs';
import { DependencyResolverClassic } from '../di/dependencyResolverClassic';

export class AttributePArser extends DependencyResolverClassic {
  source: BehaviorSubject<string>;
  constructor(str: string) {
    super();
    this.source = new BehaviorSubject<string>(str);
  }
}
