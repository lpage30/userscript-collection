import React from "react";
import "./styles.css";

export interface BlinkingRedTextProps {
  text: string;
  fontSize?: number;
}

export function BlinkingRedText({ text, fontSize = 18 }: BlinkingRedTextProps) {
  return (
    <span
      style={{
        fontSize,
        fontFamily: "Arial, sans-serif",
        color: "#d00",
        animation: "blink 1s steps(2, start) infinite",
        WebkitAnimation: "blink 1s steps(2, start) infinite",
      }}
    >
      [{text}]
      <style>{`
                @keyframes blink {
                    to { visibility: hidden; }
                }
            `}</style>
    </span>
  );
}
