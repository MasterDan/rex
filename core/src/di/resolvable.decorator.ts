import { Ctor } from 'core/src/tools/types/ctor';
import { IInjectionOptions } from './@types/injectable';
import { InjectionKey } from './@types/InjectionKey';
import { ResolveArg } from './@types/ResolveArg';
import { register, resolve, resolve$ } from './di-container';

export interface IResolveOptions {
  reactive?: boolean;
}

export type ResolveDefinition =
  | ResolveArg
  | ({ key: ResolveArg } & IResolveOptions);

export function Resolvable(
  arg?: {
    key?: InjectionKey;
    dependencies?: ResolveDefinition[];
  } & IInjectionOptions,
) {
  return (constructor: Ctor): Ctor => {
    const newClass = {
      [constructor.name]: class extends constructor {
        constructor(..._args: unknown[]) {
          const dependencies = (arg?.dependencies ?? []).map((key) => {
            if (typeof key === 'object') {
              if (key.reactive) {
                return resolve$(key.key);
              } else {
                resolve(key.key);
              }
            } else {
              return resolve(key);
            }
          });
          super(...dependencies);
        }
      },
    }[constructor.name];
    register({
      key: arg?.key ?? newClass.name,
      ctor: newClass as unknown as Ctor,
      scope: arg?.scope,
      singletone: arg?.singletone,
    });
    return newClass;
  };
}
