import { BehaviorSubject, filter, map, Observable, switchMap } from 'rxjs';
import { DiContainer } from './diContainer';

export class DependencyResolver {
  protected container$ = new BehaviorSubject<DiContainer | null>(null);

  resolveReactive<T>(key: string): Observable<T> {
    return this.container$.pipe(
      filter((c): c is DiContainer => c != null),
      switchMap((c) => c.resolveReactive<T>(key)),
      filter((v): v is T => v != null),
    );
  }
  resolve<T>(key: symbol | string): Observable<T | undefined> {
    return this.container$.pipe(
      filter((c): c is DiContainer => c != null),
      map((c) => c.resolve<T>(key)),
    );
  }

  setContainer(container: DiContainer) {
    this.container$.next(container);
  }
}
