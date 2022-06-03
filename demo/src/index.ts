import { Component, createApp, Ref, RexNode } from 'rexar';

const root = new Component({
  nodes: new RexNode(
    'div',
    null,
    'Hello, {{ word }}. This is first rexar component',
  ),
  setup() {
    const word = new Ref('Danny');
    setTimeout(() => {
      word.next('World');
    }, 2000);
    return {
      word,
    };
  },
});

createApp(root).mount('#app');
