import { Component } from '../component/component';
import { JsDomPlugin } from '../plugins/jsDomPlugin';
import { Ref } from '../scope/ref';
import { RexNode } from '../vdom/rexNode';
import { RexApp } from './app';

describe('application', () => {
  test('sample component', () => {
    const word = new Ref('Danny');
    const id = new Ref('Mi');
    const rootComponent = new Component({
      render: new RexNode(
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
      /<div id="rexApp"><div --rex--anchor=".*" id="Mi">Hello, Danny<\/div><\/div>/gm,
    );
    word.next('World');
    id.next('foo');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div --rex--anchor=".*" id="foo">Hello, World<\/div><\/div>/gm,
    );
  });
});
