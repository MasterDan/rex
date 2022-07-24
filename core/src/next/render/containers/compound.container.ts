import { isEmpty, lastEl } from '@/tools/array';
import { filter, from, pairwise, startWith, Subject, takeUntil } from 'rxjs';
import { ContainerBinding } from '../@types/IRenderable';
import { RexarContainer } from './rexar-container';

export class CompoundContainer<
  T extends RexarContainer,
> extends RexarContainer {
  children: T[];

  unbind$ = new Subject();

  constructor(...containers: T[]) {
    super();
    this.children = containers;
    this.bindChildern();
  }

  /**
   * Binds next child to previous,
   * current binding to the first item,
   * and current ownBinding to the last item,
   *
   * This method should be called after every childen mutation */
  bindChildern() {
    if (isEmpty(this.children)) {
      return;
    }
    this.unbind$.next(null);
    from(this.children)
      .pipe(startWith(null), pairwise())
      .subscribe(([previous, current]) => {
        if (previous == null) {
          this.binding$
            .pipe(
              filter((b) => b != null),
              takeUntil(this.unbind$),
            )
            .subscribe((b) => (current as RexarContainer).binding$.next(b));
        } else {
          previous.bindingOwn$
            .pipe(
              takeUntil(this.unbind$),
              filter((b) => b != null),
            )
            .subscribe((b) => (current as RexarContainer).binding$.next(b));
        }
      });
    lastEl(this.children)
      .bindingOwn$.pipe(
        takeUntil(this.unbind$),
        filter((b) => b != null),
      )
      .subscribe((b) => this.bindingOwn$.next(b));
  }

  public override inject(): ContainerBinding | undefined {
    if (this.binding$.value == null || isEmpty(this.children)) {
      this.size$.next(0);
      return;
    }
    for (const child of this.children) {
      child.inject();
    }
  }
}
