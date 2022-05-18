import { Component, createApp, Ref, RexNode } from 'rexar';

const root = new Component({
  render: new RexNode(
    'div',
    null,
    'Hello, {{ word }}. This is first rexar component',
  ),
  setup() {
    const word = new Ref('Danny');
    return {
      word,
    };
  },
});

createApp(root).mount('#app');
