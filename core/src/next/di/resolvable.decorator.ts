import { Ctor } from 'core/src/tools/types/ctor';
import { InjectionKey } from './@types/InjectionKey';
import { ResolveArg } from './@types/ResolveArg';
import { diContainer } from './di-container';

export interface IResolveOptions {
  reactive?: boolean;
}

export type ResolveDefinition =
  | ResolveArg
  | ({ key: ResolveArg } & IResolveOptions);

export function Resolvable(arg?: {
  key?: InjectionKey;
  scope?: InjectionKey;
  dependencies?: ResolveDefinition[];
}) {
  return (constructor: Ctor): Ctor => {
    const dependencies = (arg?.dependencies ?? []).map((key) => {
      if (typeof key === 'object') {
        if (key.reactive) {
          return diContainer.resolve$(key.key);
        } else {
          diContainer.resolve(key.key);
        }
      } else {
        return diContainer.resolve(key);
      }
    });
    const newClass = {
      [constructor.name]: class extends constructor {
        constructor(..._args: unknown[]) {
          super(...dependencies);
        }
      },
    }[constructor.name];
    diContainer.register({
      key: arg?.key ?? newClass.name,
      ctor: newClass as unknown as Ctor,
      scope: arg?.scope,
    });
    return newClass;
  };
}
