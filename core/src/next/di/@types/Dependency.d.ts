import { BehaviorSubject } from 'rxjs';
import { Resolver } from './Resolver';

export type Dependency<T = unknown> = Resolver<T> | BehaviorSubject<T | null>;
