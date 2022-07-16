import { Ctor } from 'core/src/tools/types/ctor';
import { InjectionKey } from './@types/InjectionKey';
import { diContainer } from './container';

export function Provide(key?: InjectionKey) {
  return function (ctor: Ctor) {
    diContainer.register({
      key: key ?? ctor.name,
      ctor,
    });
  };
}
