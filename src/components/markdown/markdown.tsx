"use client";

import { code } from "@streamdown/code";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";

const plugins = { code };
const controls = { code: { copy: true, download: false }, table: { copy: true, download: false } };

/**
 * Renders model output. Streamdown copes with half-finished markdown while a
 * reply streams in, highlights code with Shiki, and hardens links.
 * Raw HTML from the model is never rendered (skipHtml).
 */
export function Markdown({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <Streamdown
      plugins={plugins}
      controls={controls}
      isAnimating={streaming}
      skipHtml
    >
      {text}
    </Streamdown>
  );
}
