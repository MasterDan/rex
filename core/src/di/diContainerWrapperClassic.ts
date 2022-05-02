import { DiContainerClassic } from './diContainerClassic';

export class DiContainerWrapperClassic extends DiContainerClassic {
  constructor(private parent: DiContainerClassic) {
    super();
  }

  override resolve<T>(token: string | symbol): T | undefined {
    console.log(
      'here',
      super.resolve(token),
      'parent',
      this.parent.resolve(token),
    );
    return super.resolve(token) ?? this.parent.resolve(token);
  }

  isKeyFree(key: string): boolean {
    return (
      this.parent.isKeyFree(key) && this.dictionary[Symbol.for(key)] == null
    );
  }
}
