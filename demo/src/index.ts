import { Component, createApp, Ref, RexNode } from 'rexar';

const root = new Component({
  render: new RexNode(
    'div',
    null,
    'Hello, {{ word }}. This is first rexar component',
  ),
  setup() {
    const word = new Ref('Danny');
    setTimeout(() => {
      word.next('World');
    }, 5000);
    return {
      word,
    };
  },
});

createApp(root).mount('#app');
