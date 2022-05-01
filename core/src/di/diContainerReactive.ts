import { BehaviorSubject } from 'rxjs';
import { DependencyProviderReactive } from './dependencyProviderReactive';
import { DependencyResolverReactive } from './dependencyResolverReactive';
import { DiContainerClassic } from './diContainerClassic';

export class DiContainerReactive extends DiContainerClassic {
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
      result.value instanceof DependencyResolverReactive &&
      !result.value.hasContainer
    ) {
      result.value.setContainer(this);
    }
    return result;
  }

  provide(...providers: DependencyProviderReactive[]) {
    for (const provider of providers) {
      provider.setContainer(this);
    }
  }
}
