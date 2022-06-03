import { RexApp } from '../../app/app';
import { Component } from '../../component/component';
import { JsDomPlugin } from '../../plugins/jsDomPlugin';
import { Ref } from '../../scope/ref';
import { RexNode } from '../../domPrototype/rexNode';

describe('bind attribute directive', () => {
  test('bind id', () => {
    const word = new Ref('Danny');
    const rootComponent = new Component({
      nodes: new RexNode('div', {
        'id:': 'word',
      }),
      setup() {
        return {
          word,
        };
      },
    });
    const jsDom = new JsDomPlugin('<div id="rexApp" ></div>');
    new RexApp(rootComponent).extend(jsDom).mount('#rexApp');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div id="Danny" __rex__anchor=".*"><\/div><\/div>/gm,
    );
    word.next('World');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div id="World" __rex__anchor=".*"><\/div><\/div>/gm,
    );
  });
});
