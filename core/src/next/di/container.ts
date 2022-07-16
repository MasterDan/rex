import { IInjectable } from './@types/injectable';
import { Resolver } from './@types/Resolver';
import { InjectionKey } from './@types/InjectionKey';
import { Ctor } from 'core/src/tools/types/ctor';
import { Dependency } from './@types/Dependency';
import { Factory } from './@types/Factory';
import { BehaviorSubject } from 'rxjs';

function buildResolver<T = unknown>(i: IInjectable<T>): Resolver<T> {
  if (i.ctor != null) {
    return (): T => new (i.ctor as Ctor<T>)();
  } else if (i.value) {
    return (): T => i.value as T;
  } else if (i.reactive) {
    return (): T => i.reactive as T;
  } else if (i.factory) {
    return () => (i.factory as Factory<T>)();
  }
  throw new Error('Incoorect injectable');
}

function isBehaviour<T>(d: Dependency<T>): d is BehaviorSubject<T | null> {
  return d instanceof BehaviorSubject;
}

class DiContainer {
  protected dictionary: Record<symbol, Dependency> = {};

  register<T>(injectable: IInjectable<T>) {
    const symbol =
      typeof injectable.key === 'string'
        ? Symbol.for(injectable.key)
        : injectable.key;

    const resolver = buildResolver(injectable);
    const placeholder = this.dictionary[symbol];
    if (injectable.reactive) {
      if (placeholder != null) {
        if (isBehaviour(placeholder) && placeholder.value == null) {
          placeholder.next(resolver());
        } else {
          throw new Error(
            `Value with key ${symbol.toString} already exists or it's format id not reactive!`,
          );
        }
      } else {
        this.dictionary[symbol] = new BehaviorSubject<unknown | null>(
          resolver(),
        );
      }
    } else {
      if (this.dictionary[symbol] != null) {
        throw new Error(`Value with key ${symbol.toString} already exists!`);
      }
      this.dictionary[symbol] = resolver;
    }
  }

  resolve<T>(key: InjectionKey | Ctor<T> | Factory<T>): T {
    const symbol =
      typeof key === 'function'
        ? Symbol.for(key.name)
        : typeof key === 'string'
        ? Symbol.for(key)
        : key;
    const injected = this.dictionary[symbol] as Dependency<T>;
    if (isBehaviour(injected)) {
      throw new Error(
        'Using classic resolve for reactive dependency. Please use method resolve$',
      );
    }
    return injected();
  }
}

export const diContainer = new DiContainer();
