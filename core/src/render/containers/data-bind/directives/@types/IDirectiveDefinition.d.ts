import { IDirectiveBinding } from './IDirectiveBinding';

export interface IDirectiveDefinition {
  beforeMount(el: HTMLElement, binding: IDirectiveBinding);
  mounted(el: HTMLElement, binding: IDirectiveBinding);
  beforeUnmount(el: HTMLElement, binding: IDirectiveBinding);
  unmounted(el: HTMLElement, binding: IDirectiveBinding);
}
