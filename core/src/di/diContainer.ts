import { BehaviorSubject } from 'rxjs';
import type { Ctor } from '../tools/types/ctor';
import { DependencyProviderClassic } from './dependencyProviderClassic';
import { DependencyProviderReactive } from './dependencyProviderReactive';
import { DependencyResolver } from './dependencyResolver';
import { DependencyResolverClassic } from './dependencyResolverClassic';
import { DependencyResolverReactive } from './dependencyResolverReactive';
import { DiContainerClassic } from './diContainerClassic';
import { DiContainerReactive } from './diContainerReactive';
import { DiContainerWrapperClassic } from './diContainerWrapperClassic';
import { DiContainerWrapperReactive } from './diContainerWrapperReactive';

export class DiContainer {
  private diClassic = new DiContainerClassic();
  private diReactive = new DiContainerReactive();

  register<T>(
    something: T | Ctor<T>,
    key: string | symbol | undefined = undefined,
  ): {
    token: symbol;
    resolve: () => T | undefined;
  } {
    return this.diClassic.register<T>(something, key);
  }

  resolve<T>(token: symbol | string): T | undefined {
    const result = this.diClassic.resolve<T>(token);
    if (result instanceof DependencyResolverReactive) {
      result.setContainer(this.diReactive);
    } else if (result instanceof DependencyResolver) {
      result.setContainer(this);
    }
    return result;
  }

  registerReactive<T>(something: T, key: string) {
    this.diReactive.registerReactive(something, key);
  }

  resolveReactive<T>(key: string): BehaviorSubject<T | null> {
    const result = this.diReactive.resolveReactive<T>(key);
    if (result instanceof DependencyResolverClassic) {
      result.setContainer(this.diClassic);
    } else if (result instanceof DependencyResolver) {
      result.setContainer(this);
    }
    return result;
  }

  provideReactive(...providers: DependencyProviderReactive[]) {
    this.diReactive.provideReactive(...providers);
  }

  provide(...providers: DependencyProviderClassic[]) {
    this.diClassic.provide(...providers);
  }

  createScope: {
    classic: () => DiContainer;
    reactive: () => DiContainer;
  } = {
    classic: () => {
      this.diClassic = new DiContainerWrapperClassic(this.diClassic);
      return this;
    },
    reactive: () => {
      this.diReactive = new DiContainerWrapperReactive(this.diReactive);
      return this;
    },
  };

  private static createFrom(other: DiContainer): DiContainer {
    const result = new DiContainer();
    result.diClassic = other.diClassic;
    result.diReactive = other.diReactive;
    return result;
  }

  clone(): DiContainer {
    return DiContainer.createFrom(this);
  }
}
