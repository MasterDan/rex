import { registeredDirectiveNamesKey } from 'core/src/di/constants';
import { IDirectiveDefinition } from 'core/src/directives/@types/DirectiveDefinition';
import { templateStringDirName } from 'core/src/directives/builtin/templateStringDirective';
import { Attributes } from '../@types/attributes';
import { Observable, map } from 'rxjs';
import { DirectiveBase } from 'core/src/directives/directiveBase';
import { DependencyResolver } from 'core/src/di/dependencyResolver';

interface ICheckResult {
  definition: IDirectiveDefinition;
  argument: string | null;
  valueKey: string | null;
}

export class AttributeParser extends DependencyResolver {
  nonDirectiveAttributes: Attributes = null;
  constructor(public initialAttributes: Attributes) {
    super();

    if (initialAttributes == null) {
      return;
    }

    this.resolve<IDirectiveDefinition[]>(registeredDirectiveNamesKey)
      .pipe(
        map((defs) => defs.filter((def) => def.name !== templateStringDirName)),
      )
      .subscribe((definitions) => {
        for (const attribute in initialAttributes) {
          const checkResult = this.checkAttributeOnDirective(
            attribute,
            definitions,
          );
        }
      });
  }

  private checkAttributeOnDirective(
    attributeName: string,
    definitions: IDirectiveDefinition[],
  ): ICheckResult | null {
    const attrs = this.initialAttributes as Record<string, string | null>;
    for (const definition of definitions) {
      const fallbackRegExp = new RegExp(`rex-${definition.name}:([\\w-]*)`);
      const match =
        definition.frame != null
          ? definition.frame.exec(attributeName)
          : fallbackRegExp.exec(attributeName);
      if (match == null) {
        continue;
      } else {
        const positiveCheck: ICheckResult = {
          definition: definition,
          argument: null,
          valueKey: attrs[attributeName],
        };

        const argumentDetected = match[1];
        if (argumentDetected != null) {
          positiveCheck.argument = argumentDetected;
        }
        return positiveCheck;
      }
    }
    return null;
  }

  private resolveDirective<T extends DirectiveBase>(
    name: string,
  ): Observable<T> {
    return this.resolve<T>(name);
  }
}
