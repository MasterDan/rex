import { BehaviorSubject, filter, Observable, switchMap } from 'rxjs';
import { DiContainerReactive } from './diContainerReactive';

export abstract class DependencyResolverReactive {
  protected container$ = new BehaviorSubject<DiContainerReactive | null>(null);

  get hasContainer(): boolean {
    return this.container$.value != null;
  }

  setContainer(container: DiContainerReactive) {
    this.container$.next(container);
  }

  resolveReactive<T>(key: string): Observable<T> {
    return this.container$.pipe(
      filter((c): c is DiContainerReactive => c != null),
      switchMap((c) => c.resolveReactive<T>(key)),
      filter((v): v is T => v != null),
    );
  }
}
