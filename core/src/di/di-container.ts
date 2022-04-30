export class DiContainer {
  private dictionary: Record<symbol, unknown> = {};

  register<T>(something: T, description: string | undefined = undefined) {
    const sym =
      description == undefined ? Symbol(description) : Symbol.for(description);
    this.dictionary[sym] = something;
    return {
      token: sym,
      resolve: (): T => this.dictionary[sym] as T,
    };
  }
  resolve<T>(token: symbol | string): T {
    if (typeof token === 'string') {
      return this.dictionary[Symbol.for(token)] as T;
    } else {
      return this.dictionary[token] as T;
    }
  }
}
