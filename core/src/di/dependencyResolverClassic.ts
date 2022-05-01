import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import { DiContainerClassic } from './diContainerClassic';

export abstract class DependencyResolverClassic {
  protected container$ = new BehaviorSubject<DiContainerClassic | null>(null);

  get hasContainer(): boolean {
    return this.container$.value != null;
  }

  setContainer(container: DiContainerClassic) {
    this.container$.next(container);
  }

  resolve<T>(key: symbol | string): Observable<T | undefined> {
    return this.container$.pipe(
      filter((c): c is DiContainerClassic => c != null),
      map((c) => c.resolve<T>(key)),
    );
  }
}
