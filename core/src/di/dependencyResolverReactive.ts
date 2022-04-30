import { BehaviorSubject, filter, map, Observable, switchMap } from 'rxjs';
import { DiContainerReactive } from './diContainerReactive';

export abstract class DependencyResolverReactive {
  container$ = new BehaviorSubject<DiContainerReactive | null>(null);

  setContainer(container: DiContainerReactive) {
    this.container$.next(container);
  }

  resolveReactive<T>(key: string): Observable<T> {
    return this.container$.pipe(
      filter((c): c is DiContainerReactive => c != null),
      switchMap((c) => c.resolveReactive<T>(key)),
      filter((v): v is T => v != null),
      map((v) => {
        if (
          v instanceof DependencyResolverReactive &&
          v.container$.value == null &&
          this.container$.value != null
        ) {
          v.setContainer(this.container$.value);
        }
        return v;
      }),
    );
  }
}
