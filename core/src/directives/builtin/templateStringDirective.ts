import { Ref } from 'core/src/scope/ref';
import { RexNode } from 'core/src/vdom/rexNode';
import { combineLatest, filter, map, Observable, switchMap, take } from 'rxjs';
import { Directive, IDirectiveBinding, IElems } from '../directive';
import {
  getKeysToInsert,
  parseTemplateString,
} from '../stringParser/stringParser';

export const templateStringDirName = '__template_String__';
export class TemplateStringDirective extends Directive {
  name = templateStringDirName;
  childIndex: number | null = null;

  templateString$: Observable<string> = this.__sourceNode$.pipe(
    filter((n): n is RexNode => n != null),
    switchMap((n) => n.children$),
    map((val) => {
      if (this.childIndex == null && typeof val === 'string') {
        return val;
      } else if (this.childIndex != null && Array.isArray(val)) {
        return val[this.childIndex] ?? null;
      }
    }),
    filter(
      (strToRepl): strToRepl is string =>
        strToRepl != null && typeof strToRepl === 'string',
    ),
  );

  resolvedKeyValuePairs$: Observable<
    {
      key: string;
      value: string;
    }[]
  > = this.templateString$.pipe(
    switchMap((strToRepl) => {
      const keys = getKeysToInsert(strToRepl);
      const resolvedPairs = keys.map((key) =>
        this.resolveReactive<Ref<string>>(key).pipe(
          switchMap((v) => v),
          map((v) => (v == null ? '' : v)),
          map((value) => ({
            key,
            value,
          })),
        ),
      );
      return combineLatest(resolvedPairs);
    }),
  );

  templateStringParsed$: Observable<string> = combineLatest([
    this.templateString$,
    this.resolvedKeyValuePairs$,
  ]).pipe(
    map(([template, pairs]) => {
      const acc: Record<string, string> = {};
      for (const pair of pairs) {
        acc[pair.key] = pair.value;
      }
      return {
        template,
        state: acc,
      };
    }),
    map((arg) => parseTemplateString(arg.template, arg.state)),
  );

  constructor() {
    super();
    this.templateStringParsed$.subscribe((val) => this.__value$.next(val));
  }

  override init(node: RexNode): RexNode | RexNode[] {
    this.__value$
      .pipe(
        filter((val): val is string => val != null),
        take(1),
      )
      .subscribe((templateResult) => {
        if (this.childIndex != null) {
          node.children$.mutate((array) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (array as string[])[this.childIndex!] = templateResult;
            return array;
          });
        } else {
          node.children$.next(templateResult);
        }
      });
    return node;
  }

  override update(
    { element, elements }: IElems,
    { value }: IDirectiveBinding,
  ): HTMLElement[] {
    if (element == null) {
      return elements;
    }
    if (this.childIndex == null) {
      element.innerHTML = value ?? '';
    } else {
      element.childNodes[this.childIndex].nodeValue = value;
    }
    return [element];
  }
}