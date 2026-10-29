"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AnswerText } from "./AnswerText";

type AssistantMessageBubbleProps = {
  content: string;
  footer?: ReactNode;
  role: "USER" | "ASSISTANT";
};

export function AssistantMessageBubble({ content, footer, role }: AssistantMessageBubbleProps) {
  const isUser = role === "USER";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")} data-role={role}>
      <div
        className={cn(
          "max-w-[85%] rounded-tp-lg px-4 py-3",
          isUser ? "bg-tp-brand-red-tint text-tp-text" : "border border-tp-line bg-tp-bg",
        )}
      >
        {role === "ASSISTANT" ? (
          <AnswerText text={content} />
        ) : (
          <p className="whitespace-pre-wrap text-sm">{content}</p>
        )}
        {footer}
      </div>
    </div>
  );
}
