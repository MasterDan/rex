import { BehaviorSubject, filter, take } from 'rxjs';
import { DiContainerClassic } from './diContainerClassic';

export abstract class DependencyProviderClassic {
  protected container$ = new BehaviorSubject<DiContainerClassic | null>(null);

  get hasContainer(): boolean {
    return this.container$.value != null;
  }

  setContainer(container: DiContainerClassic) {
    this.container$.next(container);
  }

  protected register<T>(item: T, key: string | symbol) {
    return this.container$
      .pipe(
        filter((c): c is DiContainerClassic => c != null),
        take(1),
      )
      .subscribe((di) => {
        di.register<T>(item, key);
      });
  }

  protected onContainerSet(arg: (di: DiContainerClassic) => void) {
    this.container$
      .pipe(
        filter((c): c is DiContainerClassic => c != null),
        take(1),
      )
      .subscribe(arg);
  }
}
