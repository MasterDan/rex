import { Ctor } from 'core/src/tools/types/ctor';
import { Factory } from './Factory';
import { InjectionKey } from './InjectionKey';
import { DiContainer } from '../container';

export interface IInjectable<T = unknown> {
  key: InjectionKey;
  value?: T;
  ctor?: Ctor<T>;
  factory?: Factory<T, [DiContainer]>;
  reactive?: T;
  scope?: InjectionKey;
}
