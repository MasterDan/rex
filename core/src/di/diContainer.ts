export class DiContainer {
  protected dictionary: Record<symbol, unknown> = {};

  register<T>(something: T, description: string | undefined = undefined) {
    const sym =
      description == undefined ? Symbol(description) : Symbol.for(description);
    if (this.dictionary[sym] != null) {
      throw new Error(
        `Value with key ${description ?? sym.toString} already exists!`,
      );
    }
    this.dictionary[sym] = something;
    return {
      token: sym,
      resolve: (): T => this.resolve<T>(sym),
    };
  }
  resolve<T>(token: symbol | string): T {
    if (typeof token === 'string') {
      return this.dictionary[Symbol.for(token)] as T;
    } else {
      return this.dictionary[token] as T;
    }
  }
  isKeyFree(key: string): boolean {
    return this.dictionary[Symbol.for(key)] == null;
  }
}
