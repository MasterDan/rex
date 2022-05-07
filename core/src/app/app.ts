import { Component } from '../component/component';
import { DiContainer } from '../di/diContainer';
import { Ctor } from '../tools/types/ctor';

export function createApp(): RexApp {
  throw new Error('Not Implemented');
}

class RexApp {
  di = new DiContainer();
  constructor(root: Ctor<Component>) {
    console.log(root);
    throw new Error('Not Implemented');
  }
}
