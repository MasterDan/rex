import { filter, map } from 'rxjs';
import { htmlElementsKey } from '../constants';
import { DependencyProviderClassic } from '../dependencyProviderClassic';
import { DiContainerClassic } from '../diContainerClassic';
import { DiContainerReactive } from '../diContainerReactive';

export class HtmlElementProvider extends DependencyProviderClassic {
  constructor(elems: Record<string, HTMLElement>) {
    super();
    this.container$
      .pipe(
        filter((c): c is DiContainerClassic => c != null),
        map((di) => di.resolve<DiContainerReactive>(htmlElementsKey)),
        filter((c): c is DiContainerReactive => c != null),
      )
      .subscribe((container) => {
        for (const key in elems) {
          container.registerReactive(elems[key], key);
          console.log('registering element', elems[key], key);
        }
      });
  }
}
