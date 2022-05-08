import { BehaviorSubject, filter, Observable, switchMap, tap } from 'rxjs';
import { DiContainerReactive } from './diContainerReactive';

export abstract class DependencyResolverReactive {
  protected containerReactive$ =
    new BehaviorSubject<DiContainerReactive | null>(null);

  get hasContainer(): boolean {
    return this.containerReactive$.value != null;
  }

  setContainer(container: DiContainerReactive) {
    this.containerReactive$.next(container);
  }

  protected resolveReactive<T>(key: string): Observable<T> {
    console.log('resolving', key);
    return this.containerReactive$.pipe(
      tap((c) => {
        console.log('container exists', c != null);
      }),
      filter((c): c is DiContainerReactive => c != null),
      switchMap((c) => c.resolveReactive<T>(key)),
      filter((v): v is T => v != null),
    );
  }
}
