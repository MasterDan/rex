import { BehaviorSubject, filter, take } from 'rxjs';
import { DiContainer } from './diContainer';

export abstract class DependencyProvider {
  protected container$ = new BehaviorSubject<DiContainer | null>(null);

  get hasContainer(): boolean {
    return this.container$.value != null;
  }

  setContainer(container: DiContainer) {
    this.container$.next(container);
  }

  register<T>(item: T, key: string | symbol) {
    return this.container$
      .pipe(
        filter((c): c is DiContainer => c != null),
        take(1),
      )
      .subscribe((di) => {
        di.register<T>(item, key);
      });
  }
}
