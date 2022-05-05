import { Ref } from 'core/src/scope/ref';
import { RexNode } from 'core/src/vdom/rexNode';
import { combineLatest, first, map, switchMap } from 'rxjs';
import { Directive } from '../directive';
import { getKeysToInsert } from '../stringParser/stringParser';

export class TemplateStringDirective extends Directive {
  name = '__template_String__';

  constructor(private childIndex: number | null = null) {
    super();
  }

  override init(node: RexNode): RexNode | RexNode[] {
    if (this.childIndex == null && typeof node.children$.value === 'string') {
      const keys = getKeysToInsert(node.children$.value);
      const resolved = keys.map((key) =>
        this.resolveReactive<Ref<string>>(key).pipe(
          switchMap((v) => v),
          map((v) => (v == null ? '' : v)),
        ),
      );
      combineLatest(resolved).pipe(first()).subscribe;
    }
    return node;
  }
}
