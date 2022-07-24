import { registeredDirectiveNamesKey } from '../../di/constants';
import { DependencyProviderClassic } from '../../di/dependencyProviderClassic';
import type { Ctor } from '../../tools/types/ctor';
import { IDirectiveDefinition } from '../@types/DirectiveDefinition';
import { DirectiveBase } from '../directiveBase';

export class DirectiveProvider extends DependencyProviderClassic {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(...directives: Ctor<DirectiveBase<any>>[]) {
    super();
    this.onContainerSet((di) => {
      const existingKeys =
        di.resolve<IDirectiveDefinition[]>(registeredDirectiveNamesKey) ?? [];
      for (const dirCtor of directives) {
        const dir = new dirCtor();
        const resolvedDir = di.resolve<DirectiveBase>(dir.name);
        if (resolvedDir != null) {
          throw new Error(`Directive with name ${dir.name} already exists!`);
        }
        di.register(dirCtor, dir.name);
        existingKeys.push({
          name: dir.name,
          frame: dir._frame,
          type: dir._type,
        });
      }
      di.register(existingKeys, registeredDirectiveNamesKey);
    });
  }
}
