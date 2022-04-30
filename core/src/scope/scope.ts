import { filter } from 'rxjs';
import { DependencyProviderReactive } from '../di/dependencyProviserReactive';
import { DiContainerWrapperReactive } from '../di/diContainerWrapperReactive';
import { Ref } from './ref';

export class Scope extends DependencyProviderReactive {
  constructor(state: Record<string, Ref>) {
    super();
    this.container$
      .pipe(filter((c): c is DiContainerWrapperReactive => c != null))
      .subscribe((container) => {
        for (const key in state) {
          container.registerReactive(state[key], key);
        }
      });
  }
}
