import { isEmpty, lastEl } from 'core/src/tools/array';
import { filter, from, pairwise, startWith } from 'rxjs';
import { IContainerBinding } from '../@types/IRenderable';
import { RexarContainer } from './rexar-container';

export class RexarContainerCompound extends RexarContainer {
  children: RexarContainer[] = [];

  pushContainers(...containers: RexarContainer[]) {
    if (isEmpty(containers)) {
      return;
    }
    this.children.push(...containers);
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

  public override inject(): IContainerBinding | undefined {
    if (this.binding$.value == null || isEmpty(this.children)) {
      this.size$.next(0);
      return;
    }
    for (const child of this.children) {
      child.inject();
    }
  }
}
