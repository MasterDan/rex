import { BehaviorSubject } from 'rxjs';
import { DependencyResolver } from './dependencyResolver';
import { DependencyResolverClassic } from './dependencyResolverClassic';
import { DependencyResolverReactive } from './dependencyResolverReactive';
import { DiContainerClassic } from './diContainerClassic';
import { DiContainerReactive } from './diContainerReactive';

export class DiContainer {
  private diClassic = new DiContainerClassic();
  private diReactive = new DiContainerReactive();

  register<T>(
    something: T,
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
}
