import { DiContainer } from './diContainer';

export class DiContainerWrapper extends DiContainer {
  constructor(private parent: DiContainer) {
    super();
  }

  resolve<T>(token: string | symbol): T | undefined {
    return super.resolve(token) ?? this.parent.resolve(token);
  }

  // isKeyFree(key: string): boolean {
  //   return (
  //     this.parent.isKeyFree(key) && this.dictionary[Symbol.for(key)] == null
  //   );
  // }
}
