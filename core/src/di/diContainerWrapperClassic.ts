import { DiContainerClassic } from './diContainerClassic';

export class DiContainerWrapperClassic extends DiContainerClassic {
  constructor(private parent: DiContainerClassic) {
    super();
  }

  resolve<T>(token: string | symbol): T | undefined {
    return super.resolve(token) ?? this.parent.resolve(token);
  }

  isKeyFree(key: string): boolean {
    return (
      this.parent.isKeyFree(key) && this.dictionary[Symbol.for(key)] == null
    );
  }
}
