import { IInjectable } from './@types/injectable';
import { InjectionKey } from './@types/InjectionKey';

class DiContainer {
  protected dictionary: Record<symbol, IInjectable> = {};
  register<T>(injectable: IInjectable<T>) {
    const symbol =
      typeof injectable.key === 'string'
        ? Symbol.for(injectable.key)
        : injectable.key;
    if (this.dictionary[symbol] != null) {
      throw new Error(`Value with key ${symbol.toString} already exists!`);
    }
    this.dictionary[symbol] = injectable;
  }
  resolveCtor<T>(key: InjectionKey): T {
    const symbol = typeof key === 'string' ? Symbol.for(key) : key;
    const injected = this.dictionary[symbol] as IInjectable<T>;
    console.log('injected ctor is', injected.ctor);
    console.log('injected ctor is null', injected.ctor == null);
    if (injected.ctor == null) {
      throw new Error(
        `Value with key ${symbol.toString} is not a constructor!`,
      );
    }
    return new injected.ctor();
  }
}

export const diContainer = new DiContainer();
