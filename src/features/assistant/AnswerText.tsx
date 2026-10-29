"use client";

import * as React from "react";

type AnswerBlock =
  { kind: "p"; text: string } | { kind: "ul"; items: string[] } | { kind: "ol"; items: string[] };

export function parseAnswer(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];

  const flush = () => {
    if (bullets.length) {
      blocks.push({ kind: "ul", items: bullets });
      bullets = [];
    }
    if (ordered.length) {
      blocks.push({ kind: "ol", items: ordered });
      ordered = [];
    }
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet) {
      if (ordered.length) flush();
      bullets.push(bullet[1]);
    } else if (numbered) {
      if (bullets.length) flush();
      ordered.push(numbered[1]);
    } else {
      flush();
      if (line) blocks.push({ kind: "p", text: line });
    }
  }
  flush();
  return blocks;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text
    .split("**")
    .map((part, index) =>
      index % 2 === 1 ? <strong key={`${keyPrefix}-b${index}`}>{part}</strong> : part,
    );
}

export function AnswerText({ text }: { text: string }) {
  const blocks = React.useMemo(() => parseAnswer(text), [text]);

  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        const key = `blk-${index}`;
        if (block.kind === "ul") {
          return (
            <ul className="list-disc pl-5" key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol className="list-decimal pl-5" key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </ol>
          );
        }
        return <p key={key}>{renderInline(block.text, key)}</p>;
      })}
    </div>
  );
}
