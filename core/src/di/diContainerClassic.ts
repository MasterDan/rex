import { Ctor } from '../tools/types/ctor';
import { DependencyProviderClassic } from './dependencyProviderClassic';
import { DependencyResolverClassic } from './dependencyResolverClassic';

export class DiContainerClassic {
  protected dictionary: Record<symbol, unknown> = {};

  register<T>(
    something: T | Ctor<T>,
    key: string | symbol | undefined = undefined,
  ) {
    const sym =
      typeof key === 'symbol'
        ? key
        : key == undefined
        ? Symbol(key)
        : Symbol.for(key);
    if (this.dictionary[sym] != null) {
      throw new Error(
        `Value with key ${key?.toString() ?? sym.toString} already exists!`,
      );
    }
    this.dictionary[sym] = something;
    return {
      token: sym,
      resolve: (): T | undefined => this.resolve<T>(sym),
    };
  }
  resolve<T>(token: symbol | string): T | undefined {
    let resolved: T | Ctor<T> | undefined;
    if (typeof token === 'string') {
      resolved = this.dictionary[Symbol.for(token)] as T | Ctor<T> | undefined;
    } else {
      resolved = this.dictionary[token] as T | Ctor<T> | undefined;
    }
    const result =
      typeof resolved === 'function' ? new (resolved as Ctor<T>)() : resolved;
    if (result instanceof DependencyResolverClassic && !result.hasContainer) {
      result.setContainer(this);
    }
    return result;
  }

  provide(...providers: DependencyProviderClassic[]) {
    for (const provider of providers) {
      provider.setContainer(this);
    }
  }

  isKeyFree(key: string): boolean {
    return this.dictionary[Symbol.for(key)] == null;
  }
}
