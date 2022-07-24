import { Model } from './@types/model';
import { Ref } from './ref';

export function createModel(arg: Record<string, unknown>): Model {
  const model: Model = {};
  Object.keys(arg).forEach((key) => {
    const item = arg[key];
    if (item instanceof Ref || typeof item === 'function' || item == null) {
      model[key] = item;
      return;
    } else if (typeof item === 'object') {
      model[key] = createModel(item as Record<string, unknown>);
    } else {
      model[key] = new Ref(item);
    }
  });
  return model;
}
