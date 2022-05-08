import { filter, take } from 'rxjs';
import { directivesKey } from '../di/constants';
import { DependencyProviderClassic } from '../di/dependencyProviderClassic';
import { DiContainerClassic } from '../di/diContainerClassic';
import { Ctor } from '../tools/types/ctor';
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
        const dictionary =
          di.resolve<Record<string, Ctor<Directive>>>(directivesKey) ?? {};
        for (const dirCtor of directives) {
          const dir = new dirCtor();
          if (dictionary[dir.name] != null) {
            throw new Error(`Directive with name ${dir.name} already exists!`);
          }
          dictionary[dir.name] = dirCtor;
        }
        this.register(dictionary, directivesKey);
        return;
      });
  }
}
