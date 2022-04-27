export class DiContainer {
  private dictionary: Record<symbol, unknown> = {};

  provide<T>(something: T, description = '') {
    const sym = Symbol(description);
    this.dictionary[sym] = something;
    return {
      token: sym,
      inject: (): T => this.dictionary[sym] as T,
    };
  }
  resolve<T>(token: symbol): T {
    return this.dictionary[token] as T;
  }
}
