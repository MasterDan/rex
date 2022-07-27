import { IRenderable } from '../@types/IRenderable';
import { FragmentTemplate } from '../renderable/fragment.template';
import { RexarContainer } from './rexar-container';

export type ContainerFactory = (template?: IRenderable) => RexarContainer;

export class PipelineContainer extends RexarContainer {
  containers: RexarContainer[];

  constructor(
    protected template?: IRenderable,
    ...factories: ContainerFactory[]
  ) {
    super(template);
    const containersTemp: RexarContainer[] = [];
    let previousContainer: RexarContainer | null = null;
    for (const item of factories.reverse()) {
      if (previousContainer == null) {
        previousContainer = item(template);
      } else {
        previousContainer = item(new FragmentTemplate(previousContainer));
      }
      containersTemp.push(previousContainer);
    }
    this.containers = containersTemp.reverse();
  }
}
