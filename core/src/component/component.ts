import { Ref } from '../scope/ref';

export interface IComponentConstructorArgs {
  setup(): Record<string, Ref>;
}

export abstract class Component {
  constructor(arg: IComponentConstructorArgs) {
    console.log(arg);
    throw new Error('Not Implemented');
  }
}
