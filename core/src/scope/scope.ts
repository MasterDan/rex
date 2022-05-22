import { filter } from 'rxjs';
import { DependencyProviderReactive } from '../di/dependencyProviderReactive';
import { DiContainerReactive } from '../di/diContainerReactive';
import { Ref } from './ref';

export class Scope extends DependencyProviderReactive {
  constructor(state: Record<string, Ref>) {
    super();
    this.container$
      .pipe(filter((c): c is DiContainerReactive => c != null))
      .subscribe((container) => {
        for (const key in state) {
          container.registerReactive(state[key], key);
        }
      });
  }
}
