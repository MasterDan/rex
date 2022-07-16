import { Ctor } from 'core/src/tools/types/ctor';
import { diContainer } from './container';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Provide(key: string | symbol) {
  return function (ctor: Ctor): Ctor {
    console.log('ctor', ctor);
    console.log('ctor', new ctor());
    console.log(typeof ctor);
    diContainer.register({
      key,
      ctor,
    });
    return ctor;
  };
}
