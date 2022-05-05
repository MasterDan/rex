import { Ref } from 'core/src/scope/ref';
import { RexNode } from 'core/src/vdom/rexNode';
import { combineLatest, first, map, switchMap } from 'rxjs';
import { Directive } from '../directive';
import {
  getKeysToInsert,
  parseTemplateString,
} from '../stringParser/stringParser';

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
          map((value) => ({
            key,
            value,
          })),
        ),
      );
      combineLatest(resolved)
        .pipe(first())
        .subscribe((arr: { key: string; value: string }[]) => {
          const acc: Record<string, string> = {};
          for (const pair of arr) {
            acc[pair.key] = pair.value;
          }
          node.children$.next(
            parseTemplateString(node.children$.value as string, acc),
          );
        });
    }
    return node;
  }
}
