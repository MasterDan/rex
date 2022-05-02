import { filter, take } from 'rxjs';
import { directivesKey } from '../di/constants';
import { DependencyProviderClassic } from '../di/dependencyProviderClassic';
import { DiContainerClassic } from '../di/diContainerClassic';
import { Ctor } from '../tools/types/ctor';
import { Directive } from './directive';

export class DirectiveProvider extends DependencyProviderClassic {
  addDirectives(...directives: Ctor<Directive>[]) {
    this.container$
      .pipe(
        filter((c): c is DiContainerClassic => c != null),
        take(1),
      )
      .subscribe((di) => {
        const existing = di.resolve<Ctor<Directive>[]>(directivesKey);
        if (existing != undefined) {
          this.register<Ctor<Directive>[]>(
            [...existing, ...directives],
            directivesKey,
          );
        } else {
          this.register<Ctor<Directive>[]>(directives, directivesKey);
        }
        return;
      });
  }
}
