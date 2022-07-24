import { Ctor } from 'core/src/tools/types/ctor';
import { Factory } from './Factory';
import { InjectionKey } from './InjectionKey';

export type ResolveArg<T = unknown> = InjectionKey | Ctor<T> | Factory<T>;
