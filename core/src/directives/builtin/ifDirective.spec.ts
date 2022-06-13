import { RexNode } from '../../domPrototype/rexNode';
import { RexApp } from '../../app/app';
import { JsDomPlugin } from '../../plugins/jsDomPlugin';
import { Component } from '../../component/component';
import { Ref } from '../../scope/ref';

describe('if directive', () => {
  test('simple hiding element', () => {
    const flag = new Ref<boolean>(true);
    const rootComponent = new Component({
      nodes: new RexNode('div', { '[if]': 'flag' }, ['now you see me']),
      setup() {
        return { flag };
      },
    });
    const jsDom = new JsDomPlugin('<div id="rexApp" ></div>');
    new RexApp(rootComponent).extend(jsDom).mount('#rexApp');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div __rex__anchor=".*">now you see me<\/div><\/div>/gm,
    );
    flag.next(false);
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><\/div>/gm,
    );
    flag.next(true);
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div __rex__anchor=".*">now you see me<\/div><\/div>/gm,
    );
    flag.next(false);
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><\/div>/gm,
    );
    flag.next(true);
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div __rex__anchor=".*">now you see me<\/div><\/div>/gm,
    );
  });
});
