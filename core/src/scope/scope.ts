import { DependencyProviderReactive } from '../di/dependencyProviderReactive';
import { Ref } from './ref';

export class Scope extends DependencyProviderReactive {
  constructor(state: Record<string, Ref>) {
    super();
    this.onContainerSet((container) => {
      for (const key in state) {
        container.registerReactive(state[key], key);
      }
    });
  }
}
