import { newId } from 'core/src/tools/idGeneratorSimple';
import { Ctor } from 'core/src/tools/types/ctor';

export function Unique(prefix = '') {
  return function (target: Ctor): Ctor {
    return {
      [target.name]: class extends target {
        __u_id__ = newId(prefix);
      },
    }[target.name];
  };
}

export interface IUnique {
  __u_id__: string;
}

export function isUnique<T = unknown>(arg: T): arg is T & IUnique {
  const id = (arg as unknown as Record<string, string>)['__u_id__'];
  return id != undefined && typeof id === 'string';
}
