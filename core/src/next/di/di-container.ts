import { IInjectable } from './@types/injectable';
import { Resolver } from './@types/Resolver';
import { Ctor } from 'core/src/tools/types/ctor';
import { Dependency } from './@types/Dependency';
import { Factory } from './@types/Factory';
import { BehaviorSubject, Observable } from 'rxjs';
import { ResolveArg } from './@types/ResolveArg';

function isBehaviour<T>(d: Dependency<T>): d is BehaviorSubject<T | null> {
  return d instanceof BehaviorSubject;
}

const defaultScope = Symbol.for('default');

export class DiContainer {
  protected di: Record<symbol, Dependency> = {};

  protected values: Record<symbol, Record<symbol, unknown>> = {
    [defaultScope]: {},
  };

  protected scopes: Record<symbol, Record<symbol, Dependency>> = {};

  private currentScope: symbol | null = null;

  startScope(key: string | symbol) {
    const symbol = typeof key === 'string' ? Symbol.for(key) : key;
    this.currentScope = symbol;
  }

  endScope() {
    this.currentScope = null;
  }

  register<T>(injectable: IInjectable<T>) {
    const symbol =
      typeof injectable.key === 'string'
        ? Symbol.for(injectable.key)
        : injectable.key;

    const resolver = this.buildResolver(injectable, symbol);
    const di: Record<symbol, Dependency> = (() => {
      if (injectable.scope != null) {
        const symbolScope: symbol =
          typeof injectable.scope === 'string'
            ? Symbol.for(injectable.scope)
            : injectable.scope;
        if (this.scopes[symbolScope] == undefined) {
          this.scopes[symbolScope] = {};
        }
        return this.scopes[symbolScope];
      } else {
        return this.di;
      }
    })();
    const placeholder = di[symbol];
    if (injectable.reactive) {
      if (placeholder != null) {
        if (isBehaviour(placeholder) && placeholder.value == null) {
          placeholder.next(resolver());
        } else {
          throw new Error(
            `Value with key ${symbol.toString()} already exists or it's format id not reactive!`,
          );
        }
      } else {
        di[symbol] = new BehaviorSubject<unknown | null>(resolver());
      }
    } else {
      if (di[symbol] != null) {
        throw new Error(`Value with key ${symbol.toString()} already exists!`);
      }
      di[symbol] = resolver;
    }
  }

  resolve<T>(key: ResolveArg<T>): T | null {
    const symbol =
      typeof key === 'function'
        ? Symbol.for(key.name)
        : typeof key === 'string'
        ? Symbol.for(key)
        : key;

    const injected =
      this.currentScope != null
        ? this.scopes[this.currentScope][symbol] ?? this.di[symbol]
        : this.di[symbol];
    if (isBehaviour(injected)) {
      throw new Error(
        'Using classic resolve for reactive dependency. Please use method resolve$',
      );
    }
    return injected != null ? (injected as () => T)() : null;
  }

  resolve$<T>(key: ResolveArg<T>): Observable<T | null> {
    const symbol =
      typeof key === 'function'
        ? Symbol.for(key.name)
        : typeof key === 'string'
        ? Symbol.for(key)
        : key;
    const injected = this.di[symbol] as Dependency<T>;
    if (injected == null) {
      this.di[symbol] = new BehaviorSubject<unknown | null>(null);
      return this.di[symbol] as BehaviorSubject<T | null>;
    } else if (isBehaviour(injected)) {
      return injected;
    } else {
      throw new Error(
        'Using reactive resolve for classic dependency. Please use method resolve$',
      );
    }
  }

  private buildResolver<T = unknown>(
    i: IInjectable<T>,
    key: symbol,
  ): Resolver<T> {
    const isSingleTone = i.singletone === true;
    const valueExtractor: (resolver: Resolver<T>) => Resolver<T> = isSingleTone
      ? (resolver) => {
          const scopeSymbol = this.currentScope ?? defaultScope;
          return () => {
            const existingValue: T | null =
              (this.values[scopeSymbol][key] as T) ?? null;
            if (existingValue == null) {
              const val = resolver();
              this.values[scopeSymbol][key] = val;
              return val;
            } else {
              return existingValue as T;
            }
          };
        }
      : (resolver) => resolver;
    if (i.ctor != null) {
      return valueExtractor((): T => new (i.ctor as Ctor<T>)());
    } else if (i.value) {
      return valueExtractor((): T => i.value as T);
    } else if (i.reactive) {
      return valueExtractor((): T => i.reactive as T);
    } else if (i.factory) {
      return valueExtractor(() =>
        (i.factory as Factory<T, [DiContainer]>)(this),
      );
    }
    throw new Error('Incoorect injectable');
  }
}

export const diContainer = new DiContainer();
