import { DependencyResolverClassic } from './dependencyResolverClassic';

export class DiContainerClassic {
  protected dictionary: Record<symbol, unknown> = {};

  register<T>(something: T, key: string | symbol | undefined = undefined) {
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
    let result: T | undefined;
    if (typeof token === 'string') {
      result = this.dictionary[Symbol.for(token)] as T | undefined;
    } else {
      result = this.dictionary[token] as T | undefined;
    }
    if (result instanceof DependencyResolverClassic && !result.hasContainer) {
      result.setContainer(this);
    }
    return result;
  }
  isKeyFree(key: string): boolean {
    return this.dictionary[Symbol.for(key)] == null;
  }
}
