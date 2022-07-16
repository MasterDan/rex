import { Ctor } from 'core/src/tools/types/ctor';
import { InjectionKey } from './@types/InjectionKey';
import { ResolveArg } from './@types/ResolveArg';
import { diContainer } from './container';

export function Resolvable(arg?: {
  key?: InjectionKey;
  dependencies?: ResolveArg[];
}) {
  return (constructor: Ctor): Ctor => {
    const newClass = {
      [constructor.name]: class extends constructor {
        constructor(..._args: unknown[]) {
          if (
            arg != null &&
            arg.dependencies != null &&
            arg.dependencies.length > 0
          ) {
            super(...arg.dependencies.map((key) => diContainer.resolve(key)));
          } else {
            super();
          }
        }
      },
    }[constructor.name];
    diContainer.register({
      key: arg?.key ?? newClass.name,
      ctor: newClass as unknown as Ctor,
    });
    return newClass;
  };
}
