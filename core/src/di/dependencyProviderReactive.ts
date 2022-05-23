import { BehaviorSubject, filter, take } from 'rxjs';
import { DiContainerReactive } from './diContainerReactive';

export abstract class DependencyProviderReactive {
  protected container$ = new BehaviorSubject<DiContainerReactive | null>(null);

  get hasContainer(): boolean {
    return this.container$.value != null;
  }

  setContainer(container: DiContainerReactive) {
    this.container$.next(container);
  }

  protected registerReactive<T>(item: T, key: string) {
    return this.container$
      .pipe(
        filter((c): c is DiContainerReactive => c != null),
        take(1),
      )
      .subscribe((di) => {
        di.registerReactive<T>(item, key);
      });
  }

  protected onContainerSet(fn: (di: DiContainerReactive) => void) {
    this.container$
      .pipe(filter((c): c is DiContainerReactive => c != null))
      .subscribe(fn);
  }
}
