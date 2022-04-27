export class DiContainer {
  private dictionary: Record<symbol, unknown> = {};

  provide<T>(something: T, description = '') {
    const sym = Symbol(description);
    this.dictionary[sym] = something;
    return {
      symbol: sym,
      inject: (): T => this.dictionary[sym] as T,
    };
  }
}
