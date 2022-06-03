import { Component } from '../component/component';
import { JsDomPlugin } from '../plugins/jsDomPlugin';
import { Ref } from '../scope/ref';
import { RexNode } from '../domPrototype/rexNode';
import { RexApp } from './app';

describe('application', () => {
  test('sample component', () => {
    const word = new Ref('Danny');
    const id = new Ref('Mi');
    const rootComponent = new Component({
      nodes: new RexNode(
        'div',
        {
          'id:': 'id',
        },
        'Hello, {{ word }}',
      ),
      setup() {
        return {
          word,
          id,
        };
      },
    });
    const jsDom = new JsDomPlugin('<div id="rexApp" ></div>');
    new RexApp(rootComponent).extend(jsDom).mount('#rexApp');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div __rex__anchor=".*" id="Mi">Hello, Danny<\/div><\/div>/gm,
    );
    word.next('World');
    id.next('foo');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div __rex__anchor=".*" id="foo">Hello, World<\/div><\/div>/gm,
    );
  });
});
