import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import { DiContainer } from './diContainer';

export abstract class DependencyResolver {
  protected container$ = new BehaviorSubject<DiContainer | null>(null);

  setContainer(container: DiContainer) {
    this.container$.next(container);
  }

  resolve<T>(key: symbol | string): Observable<T> {
    return this.container$.pipe(
      filter((c): c is DiContainer => c != null),
      map((c) => c.resolve<T>(key)),
    );
  }
}
