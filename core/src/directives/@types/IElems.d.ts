import { RexNode } from 'core/src/domPrototype/rexNode';

export interface IElems {
  parent: HTMLElement | null;
  element: HTMLElement | null;
  elements: HTMLElement[];
}

export interface INode {
  node: RexNode;
}

export type ElemsWithNode = IElems & INode;
