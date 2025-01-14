import { match, eatMatch, fail } from '@bablr/helpers/grammar/node';
import { tok, chrs } from '@bablr/helpers/shorthand';
import { mapProductions } from '@bablr/helpers/enhancers';
import * as sym from '@bablr/helpers/symbols';

const spaceDelimitedTypes = ['Identifier', 'Keyword'];

const getlastRealToken = (context, s) => {
  let token = s.lastToken;
  while (token.type === sym.startNode || token.type === sym.endNode) {
    token = context.getPreviousToken(token);
  }
  return token;
};

const requiresSeparator = (context, s, type) => {
  return (
    !!s.lastToken &&
    spaceDelimitedTypes.includes(getlastRealToken(context, s).type) &&
    spaceDelimitedTypes.includes(type)
  );
};

export const triviaPattern = /\s|\/\*|\/\//y;

function* eatSep() {
  const guardMatch = yield match(chrs(triviaPattern));
  if (guardMatch) yield eatMatch(tok('Separator', { guardMatch }));
}

export const triviaEnhancer = (grammar) => {
  return mapProductions((production) => {
    return {
      ...production,
      *match(props, ...args) {
        const { state: s, context: ctx } = props;
        const grammar = ctx.grammars.get(sym.token);

        const generator = production.match(props, ...args);

        try {
          let current = generator.next();

          while (!current.done) {
            const instr = current.value;
            const cause = instr.error;
            let returnValue;

            instr.error = cause && new Error(undefined, { cause });

            switch (instr.type) {
              case sym.match: {
                const { matchable, effects } = instr.value;
                const { type } = matchable.production;

                if (matchable.type === sym.token && grammar.is('Token', type)) {
                  const spaceIsAllowed = s.lexicalContext === 'Bare';

                  if (spaceIsAllowed) {
                    const matchedSeparator =
                      s.lastToken.type === 'EndComment' ||
                      s.lastToken.type === 'Whitespace' ||
                      !!(yield* eatSep());

                    if (requiresSeparator(ctx, s, type) && !matchedSeparator) {
                      if (effects.failure === sym.fail) {
                        yield fail();
                      } else {
                        returnValue = null;
                      }
                    }
                  }
                }

                returnValue = returnValue || (yield instr);
                break;
              }

              default:
                returnValue = yield instr;
                break;
            }

            current = generator.next(returnValue);
          }
        } catch (e) {
          generator.throw(e);
        }
      },
    };
  }, grammar);
};
