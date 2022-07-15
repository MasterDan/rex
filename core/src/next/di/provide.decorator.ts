import { Ctor } from 'core/dist/types';
import { diContainer } from './container';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Provide(key: string | symbol) {
  return <T>(ctor: Ctor<T>): Ctor<T> => {
    console.log('ctor', ctor);
    diContainer.register({
      key,
      ctor,
    });
    return ctor;
  };
}
