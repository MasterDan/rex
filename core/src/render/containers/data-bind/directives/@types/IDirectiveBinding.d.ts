export interface IDirectiveBinding<T> {
  value: T;
  argument: string;
  modifiers: Record<string, boolean>;
}
