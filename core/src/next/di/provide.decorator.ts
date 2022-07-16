import { Ctor } from 'core/src/tools/types/ctor';
import { InjectionKey } from './@types/InjectionKey';
import { diContainer } from './container';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Provide(key?: InjectionKey) {
  return function (ctor: Ctor): Ctor {
    diContainer.register({
      key: key ?? ctor.name,
      ctor,
    });
    return ctor;
  };
}
