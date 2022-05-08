import { Component } from '../component/component';
import { DiContainer } from '../di/diContainer';

export function createApp(): RexApp {
  throw new Error('Not Implemented');
}

class RexApp {
  di = new DiContainer();
  constructor(root: Component) {
    console.log(root);
    throw new Error('Not Implemented');
  }
}
