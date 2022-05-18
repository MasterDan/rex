import type { Ctor } from '../tools/types/ctor';
import { DiContainerClassic } from './diContainerClassic';

export class DiContainerWrapperClassic extends DiContainerClassic {
  constructor(private parent: DiContainerClassic) {
    super();
  }

  override register<T>(
    something: T | Ctor<T>,
    key?: string | symbol | undefined,
  ): { token: symbol; resolve: () => T | undefined } {
    return super.register<T>(something, key);
  }

  override resolve<T>(token: string | symbol): T | undefined {
    return super.resolve(token) ?? this.parent.resolve(token);
  }

  isKeyFree(key: string): boolean {
    return (
      this.parent.isKeyFree(key) && this.dictionary[Symbol.for(key)] == null
    );
  }
}
