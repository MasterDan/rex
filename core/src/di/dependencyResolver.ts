import { BehaviorSubject, filter, map, switchMap, take } from 'rxjs';
import type { Observable } from 'rxjs';
import type { DiContainer } from './diContainer';

export class DependencyResolver {
  protected container$ = new BehaviorSubject<DiContainer | null>(null);

  protected resolveReactive<T>(key: string): Observable<T> {
    return this.container$.pipe(
      filter((c): c is DiContainer => c != null),
      switchMap((c) => c.resolveReactive<T>(key)),
      filter((v): v is T => v != null),
    );
  }
  protected resolve<T>(key: symbol | string): Observable<T> {
    return this.container$.pipe(
      filter((c): c is DiContainer => c != null),
      map((c) => c.resolve<T>(key)),
      filter((v): v is T => v != null),
      take(1),
    );
  }

  setContainer(container: DiContainer) {
    this.container$.next(container);
  }
}
