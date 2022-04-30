import { BehaviorSubject } from 'rxjs';
import { DependencyResolverReactive } from './dependencyResolverReactive';
import { DiContainer } from './diContainer';

export class DiContainerReactive extends DiContainer {
  registerReactive<T>(something: T, key: string) {
    const sym = Symbol.for(key);
    if (this.dictionary[sym] != null) {
      (this.dictionary[sym] as BehaviorSubject<T | null>).next(something);
    }
    this.dictionary[sym] = new BehaviorSubject<T | null>(something);
  }

  resolveReactive<T>(key: string): BehaviorSubject<T | null> {
    const sym = Symbol.for(key);
    if (this.dictionary[sym] == null) {
      this.dictionary[sym] = new BehaviorSubject<T | null>(null);
    }
    const result = this.dictionary[sym] as BehaviorSubject<T | null>;
    if (
      result instanceof DependencyResolverReactive &&
      result.container$.value == null
    ) {
      result.setContainer(this);
    }
    return result;
  }
}
