import { filter, take } from 'rxjs';
import { DependencyProvider } from '../di/dependencyProvider';
import { DiContainer } from '../di/diContainer';
import { Directive } from './directive';

const directivesKey = Symbol('directives');

export class DirectiveProvider extends DependencyProvider {
  addDirective(...directives: Directive[]) {
    this.container$
      .pipe(
        filter((c): c is DiContainer => c != null),
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
