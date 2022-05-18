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
    expect(jsDom.dom.window.document.body.innerHTML).toBe(
      /<div id="rexApp"><div rex-node-updatable=".*">Hello, Danny<\/div><\/div>/gm,
    );
  });
  test('Div with array of children', () => {
    const rootComponent = new Component({
      render: new RexNode('div', null, [
        '{{ foo }}',
        new RexNode('span', null, '-'),
        '{{ bar }}',
      ]),
      setup() {
        const foo = new Ref('fizz');
        const bar = new Ref('buzz');
        return {
          foo,
          bar,
        };
      },
    });
    const jsDom = new JsDomPlugin('<div id="rexApp" ></div>');
    new RexApp(rootComponent).extend(jsDom).mount('#rexApp');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div rex-node-updatable=".*">fizz<span>-<\/span>buzz<\/div><\/div>/gm,
    );
  });
});
