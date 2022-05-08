import { Component } from '../component/component';
import { JsDomPlugin } from '../plugins/jsDomPlugin';
import { Ref } from '../scope/ref';
import { RexNode } from '../vdom/rexNode';
import { RexApp } from './app';

describe('application tests', () => {
  test('Simple Component', () => {
    const rootComponent = new Component({
      render: new RexNode('div', null, 'Hello, {{ word }}'),
      setup() {
        const word = new Ref('Danny');
        return {
          word,
        };
      },
    });
    const jsDom = new JsDomPlugin('<div id="rexApp" ></div>');
    new RexApp(rootComponent).extend(jsDom).mount('#rexApp');
    console.log(jsDom.dom.window.document.body.innerHTML);
    expect(jsDom.dom.window.document.body.innerHTML).toBe(
      '<div id="rexApp"><div>Hello, Danny</div></div>',
    );
  });
});
