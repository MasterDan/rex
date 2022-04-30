import { BehaviorSubject } from 'rxjs';
import { DiContainerReactive } from './diContainerReactive';

export class DiContainerWrapperReactive extends DiContainerReactive {
  constructor(private parent: DiContainerReactive) {
    super();
  }

  resolve<T>(token: string | symbol): T {
    return super.resolve(token) ?? this.parent.resolve(token);
  }

  destroy() {
    return this.parent;
  }

  isKeyFree(key: string): boolean {
    return (
      this.parent.isKeyFree(key) && this.dictionary[Symbol.for(key)] == null
    );
  }

  resolveReactive<T>(key: string): BehaviorSubject<T | null> {
    if (this.isKeyFree(key)) {
      this.dictionary[Symbol.for(key)] = new BehaviorSubject<T | null>(null);
    }
    return (
      (this.dictionary[Symbol.for(key)] as BehaviorSubject<T | null>) ??
      this.parent.resolveReactive<T>(key)
    );
  }
}
