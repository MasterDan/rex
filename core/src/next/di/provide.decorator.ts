import { Ctor } from 'core/src/tools/types/ctor';
import { InjectionKey } from './@types/InjectionKey';
import { diContainer } from './container';

export function Provide(key?: InjectionKey): ClassDecorator {
  return (ctor) => {
    diContainer.register({
      key: key ?? ctor.name,
      ctor: ctor as unknown as Ctor,
    });
  };
}
