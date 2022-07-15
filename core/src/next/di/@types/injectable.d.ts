import { Ctor } from 'core/src/tools/types/ctor';
import { Observable } from 'rxjs';
import { Factory } from './fabric';
import { InjectionKey } from './InjectionKey';

export interface IInjectable<T = unknown> {
  key: InjectionKey;
  value?: T;
  ctor?: Ctor<T>;
  factory?: Factory<T>;
  reactive?: Observable<T>;
}
