import { isEmpty, lastEl } from 'core/src/tools/array';
import { filter, from, pairwise, startWith } from 'rxjs';
import { ContainerBinding } from '../@types/IRenderable';
import { RexarContainer } from './rexar-container';

export class RexarContainerCompound extends RexarContainer {
  children: RexarContainer[];

  constructor(...containers: RexarContainer[]) {
    super();
    this.children = containers;
    this.bindChildern();
  }

  bindChildern() {
    if (isEmpty(this.children)) {
      return;
    }
    from(this.children)
      .pipe(startWith(null), pairwise())
      .subscribe(([previous, current]) => {
        if (previous == null) {
          this.binding$
            .pipe(filter((b) => b != null))
            .subscribe((b) => (current as RexarContainer).binding$.next(b));
        } else {
          previous.bindingOwn$.subscribe((b) =>
            (current as RexarContainer).binding$.next(b),
          );
        }
      });
    lastEl(this.children).bindingOwn$.subscribe((b) =>
      this.bindingOwn$.next(b),
    );
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
