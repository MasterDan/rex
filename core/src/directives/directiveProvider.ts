import { registeredDirectiveNamesKey } from '../di/constants';
import { DependencyProviderClassic } from '../di/dependencyProviderClassic';
import type { Ctor } from '../tools/types/ctor';
import { Directive } from './directive';

export class DirectiveProvider extends DependencyProviderClassic {
  constructor(...directives: Ctor<Directive>[]) {
    super();
    this.onContainerSet((di) => {
      const existingKeys =
        di.resolve<string[]>(registeredDirectiveNamesKey) ?? [];
      for (const dirCtor of directives) {
        const dir = new dirCtor();
        const resolvedDir = di.resolve<Directive>(dir.name);
        if (resolvedDir != null) {
          throw new Error(`Directive with name ${dir.name} already exists!`);
        }
        di.register(dirCtor, dir.name);
        existingKeys.push(dir.name);
        di.register(existingKeys, registeredDirectiveNamesKey);
      }
    });
  }
}
