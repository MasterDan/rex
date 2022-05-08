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
        return {
          word: new Ref('Danny'),
        };
      },
    });
    const jsDom = new JsDomPlugin('<div id="rexApp" ></div>');
    new RexApp(rootComponent).extend(jsDom).mount('#rexApp');
    const text =
      jsDom.dom.window.document.querySelector('#rexApp')?.textContent;
    console.log('inner Text Is', text);
  });
});
