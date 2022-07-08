export interface IDirectiveDefinition {
  name: string;
  frame: RegExp | null;
  type: DirectiveType;
}
