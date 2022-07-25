import { isEmpty, lastEl } from '@/tools/array';
import {
  BehaviorSubject,
  filter,
  from,
  pairwise,
  startWith,
  takeUntil,
  Subject,
} from 'rxjs';
import { IRenderable } from '../@types/IRenderable';
import { RexarContainer } from './rexar-container';
import { VanishingContainer } from './vanishing.container';

export interface ISigned<T> {
  container: T;
  id: string | number | symbol;
}

export class DynamicCompoundContainer extends RexarContainer {
  private children$ = new BehaviorSubject<ISigned<VanishingContainer>[] | null>(
    null,
  );

  private unbindBody$ = new Subject();

  constructor(...args: ISigned<IRenderable>[]) {
    super();
    this.children$.subscribe((v) => {
      this.bindChildren(v);
    });
    this.children$.next(
      args.map((i) => ({
        id: i.id,
        container: new VanishingContainer(i.container),
      })),
    );
  }

  private bindChildren(children: ISigned<VanishingContainer>[] | null) {
    this.unbindBody$.next(null);
    if (isEmpty(children)) {
      this.binding$.subscribe((v) => this.bindingOwn$.next(v));
      return;
    }
    from(children)
      .pipe(startWith(null), pairwise())
      .subscribe(([previous, current]) => {
        if (previous == null) {
          this.binding$
            .pipe(
              takeUntil(this.unbindBody$),
              filter((b) => b != null),
            )
            .subscribe((b) =>
              (current?.container as RexarContainer).binding$.next(b),
            );
        } else {
          previous.container.bindingOwn$
            .pipe(
              takeUntil(this.unbindBody$),
              filter((x) => x != null),
            )
            .subscribe((binding) => {
              (current as ISigned<VanishingContainer>).container.binding$.next(
                binding,
              );
            });
        }
      });
    lastEl(children)
      .container.bindingOwn$.pipe(
        takeUntil(this.unbindBody$),
        filter((v) => v != null),
      )
      .subscribe((b) => this.bindingOwn$.next(b));
  }

  public override inject(): void {
    if (this.binding$.value == null || isEmpty(this.children$.value)) {
      this.size$.next(0);
      return;
    }
    for (const child of this.children$.value) {
      child.container.inject();
    }
  }
}
