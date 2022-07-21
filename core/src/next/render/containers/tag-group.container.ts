import { documentKey } from 'core/src/di/constants';
import { diContainer } from '../../di/di-container';
import { Resolvable } from '../../di/resolvable.decorator';
import { RexarTag } from '../nodes/rexar-tag';
import { RexarContainer } from './rexar-container';

@Resolvable({ dependencies: [documentKey] })
class TagGroup extends RexarContainer {
  constructor(document: Document) {
    super(document);
  }
}

export function tagGroup(...children: RexarTag[]): TagGroup {
  const group = diContainer.resolve(TagGroup) as TagGroup;
  group.template = {
    render: () => children.map((child) => child.render()),
  };
  return group;
}
