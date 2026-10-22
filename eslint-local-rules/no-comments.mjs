const DIRECTIVE_PATTERNS = [
  /\beslint-(?:disable|enable|env)\b/,
  /@ts-(?:expect-error|ignore|nocheck|check)\b/,
  /@(?:vitest|jest)-environment\b/,
  /\bprettier-ignore\b/,
  /\b(?:istanbul|c8|v8)\s+ignore\b/,
  /@(?:license|preserve|copyright)\b/,
  /@jsx(?:Runtime|Frag|ImportSource)?\b/,
];

function isDirective(value) {
  return DIRECTIVE_PATTERNS.some((pattern) => pattern.test(value));
}

function isJsxComment(sourceCode, comment) {
  const node = sourceCode.getNodeByRangeIndex(comment.range[0]);
  return node?.type === "JSXExpressionContainer" || node?.type === "JSXEmptyExpression";
}

function expandToLine(text, sourceCode, comment) {
  let start = comment.range[0];
  let end = comment.range[1];

  let before = start - 1;
  while (before >= 0 && /\s/.test(text[before])) before -= 1;
  let after = end;
  while (after < text.length && /\s/.test(text[after])) after += 1;

  if (
    comment.type === "Block" &&
    isJsxComment(sourceCode, comment) &&
    text[before] === "{" &&
    text[after] === "}"
  ) {
    start = before;
    end = after + 1;
  }

  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEndIndex = text.indexOf("\n", end);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  const beforeIsWhitespace = text.slice(lineStart, start).trim() === "";
  const afterIsWhitespace = text.slice(end, lineEnd).trim() === "";

  if (beforeIsWhitespace && afterIsWhitespace) {
    return [lineStart, lineEnd < text.length ? lineEnd + 1 : lineEnd];
  }
  if (beforeIsWhitespace) {
    return [lineStart, end];
  }
  if (afterIsWhitespace) {
    return [start, lineEnd];
  }
  return [start, end];
}

const noComments = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow comments in React component files",
    },
    fixable: "code",
    schema: [],
    messages: {
      noComments: "Remove comments from React component files.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const text = sourceCode.getText();

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (isDirective(comment.value)) continue;

          context.report({
            loc: comment.loc,
            messageId: "noComments",
            fix(fixer) {
              return fixer.removeRange(expandToLine(text, sourceCode, comment));
            },
          });
        }
      },
    };
  },
};

export default noComments;
