import { registeredDirectiveNamesKey } from 'core/src/di/constants';
import { IDirectiveDefinition } from 'core/src/directives/@types/DirectiveDefinition';
import { templateStringDirName } from 'core/src/directives/builtin/templateStringDirective';
import { Attributes } from '../@types/attributes';
import { Observable, map } from 'rxjs';
import { DirectiveBase } from 'core/src/directives/directiveBase';
import { DependencyResolver } from 'core/src/di/dependencyResolver';
import { DirectiveType } from 'core/src/directives/@types/DirectiveType';

export interface IDirectiveDefinitionExtended {
  definition: IDirectiveDefinition;
  argument: string | null;
  valueKey: string | null;
}
/** Separates attributes from directives */
export class AttributeParser extends DependencyResolver {
  nonDirectiveAttributes: Attributes = null;
  directiveDefinitionStructural: IDirectiveDefinitionExtended | null = null;
  directiveDefinitionsClassic: IDirectiveDefinitionExtended[] | null = null;
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
        const definitionsExtended: IDirectiveDefinitionExtended[] = [];
        for (const attribute in initialAttributes) {
          const checkResult = this.checkAttributeOnDirective(
            attribute,
            definitions,
          );
          if (checkResult != null) {
            definitionsExtended.push(checkResult);
          } else {
            const attrs = this.nonDirectiveAttributes ?? {};
            attrs[attribute] = initialAttributes[attribute];
            this.nonDirectiveAttributes = attrs;
          }
        }
        const classicDirsDefs = definitionsExtended.filter(
          (de) => (de.definition.type = DirectiveType.Classic),
        );
        const structDirsDefs = definitionsExtended.filter(
          (de) => (de.definition.type = DirectiveType.Structural),
        );
        if (structDirsDefs.length > 1) {
          throw new Error(
            'It cannot be more than one structural Directive on RexNode',
          );
        } else if (structDirsDefs.length === 1) {
          this.directiveDefinitionStructural = structDirsDefs[0];
        }
        this.directiveDefinitionsClassic = classicDirsDefs;
      });
  }

  private checkAttributeOnDirective(
    attributeName: string,
    definitions: IDirectiveDefinition[],
  ): IDirectiveDefinitionExtended | null {
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
        const positiveCheck: IDirectiveDefinitionExtended = {
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
