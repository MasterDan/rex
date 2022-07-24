import { Ctor } from 'core/src/tools/types/ctor';
import { Factory } from './Factory';
import { InjectionKey } from './InjectionKey';
import { DiContainer } from '../di-container';

export interface IInjectable<T = unknown> extends IInjectionOptions {
  key: InjectionKey;
  value?: T;
  ctor?: Ctor<T>;
  factory?: Factory<T, [DiContainer]>;
}

export interface IInjectionOptions {
  reactive?: T;
  singletone?: boolean;
  scope?: InjectionKey;
}
