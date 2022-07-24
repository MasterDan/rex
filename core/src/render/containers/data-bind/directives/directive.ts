import { IDirectiveDefinition } from './@types/IDirectiveDefinition';

export class Directive implements IDirectiveDefinition {
  constructor(private definition: Partial<IDirectiveDefinition>) {}

  beforeMount(el: HTMLElement, binding: any) {
    if (this.definition?.beforeMount) {
      this.definition?.beforeMount(el, binding);
    }
  }

  mounted(el: HTMLElement, binding: any) {
    if (this.definition?.mounted) {
      this.definition?.mounted(el, binding);
    }
  }

  beforeUnmount(el: HTMLElement, binding: any) {
    if (this.definition?.beforeUnmount) {
      this.definition?.beforeUnmount(el, binding);
    }
  }

  unmounted(el: HTMLElement, binding: any) {
    if (this.definition?.unmounted) {
      this.definition?.unmounted(el, binding);
    }
  }
}
