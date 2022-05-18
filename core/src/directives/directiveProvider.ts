import { filter, take } from 'rxjs';
import { DependencyProviderClassic } from '../di/dependencyProviderClassic';
import { DiContainerClassic } from '../di/diContainerClassic';
import type { Ctor } from '../tools/types/ctor';
import { Directive } from './directive';

export class DirectiveProvider extends DependencyProviderClassic {
  constructor(...directives: Ctor<Directive>[]) {
    super();
    this.container$
      .pipe(
        filter((c): c is DiContainerClassic => c != null),
        take(1),
      )
      .subscribe((di) => {
        for (const dirCtor of directives) {
          const dir = new dirCtor();
          const resolvedDir = di.resolve<Directive>(dir.name);
          if (resolvedDir != null) {
            throw new Error(`Directive with name ${dir.name} already exists!`);
          }
          this.register(dirCtor, dir.name);
        }
        return;
      });
  }
}
