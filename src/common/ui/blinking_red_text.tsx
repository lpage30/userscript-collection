import React from "react";
import { createBlinkingContentElement } from "./style_functions";
import "./styles.css";

export interface BlinkingRedTextProps {
  text: string;
  fontSize?: number;
}

export function BlinkingRedText({ text, fontSize = 18 }: BlinkingRedTextProps) {
  return createBlinkingContentElement({
    returnElementTagName: 'span',
    fontSize,
    content: `[${text}]`
  })
}
