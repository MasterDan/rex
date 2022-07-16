import { Ctor } from 'core/src/tools/types/ctor';
import { Factory } from './Афсещкнн';
import { InjectionKey } from './InjectionKey';

export interface IInjectable<T = unknown> {
  key: InjectionKey;
  value?: T;
  ctor?: Ctor<T>;
  factory?: Factory<T>;
  reactive?: T;
}
