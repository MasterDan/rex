import { filter, take } from 'rxjs';
import { directivesKey } from '../di/constants';
import { DependencyProvider } from '../di/dependencyProvider';
import { DiContainerClassic } from '../di/diContainerClassic';
import { Directive } from './directive';

export class DirectiveProvider extends DependencyProvider {
  addDirectives(...directives: Directive[]) {
    this.container$
      .pipe(
        filter((c): c is DiContainerClassic => c != null),
        take(1),
      )
      .subscribe((di) => {
        const existing = di.resolve<Directive[]>(directivesKey);
        if (existing != undefined) {
          this.register<Directive[]>(
            [...existing, ...directives],
            directivesKey,
          );
        } else {
          this.register<Directive[]>(directives, directivesKey);
        }
        return;
      });
  }
}
