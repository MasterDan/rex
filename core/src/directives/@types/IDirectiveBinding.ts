export interface IDirectiveBinding<T = string> {
  argument: string | null;
  value: T | null;
  oldValue: T | null;
  modifiers: Record<string, boolean> | null;
}
