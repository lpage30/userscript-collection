import React from "react";
import "./styles.scss";

const defaultFontSize = 12;
const defaultBackgroundColors = {
  hover: "#0066cc",
  regular: "#000080",
};
export interface TextSettings {
  innerHTML: string;
  backgroundColors?: {
    hover: string;
    regular: string;
  };
  fontSize?: number;
}

export interface setAsClickableTextComponentProps {
  element: HTMLElement;
  getTextSettings: () => Promise<TextSettings>;
  onClick: () => Promise<void>;
}
export async function setAsClickableTextComponent({
  element,
  onClick,
  getTextSettings,
}: setAsClickableTextComponentProps) {
  element.style.color = "#FFFFFF";
  element.style.padding = "8px 16px";
  element.style.border = "none";
  element.style.borderRadius = "6px";
  element.style.cursor = "pointer";
  element.style.display = "inline-block";
  element.style.textDecoration = "none";
  element.style.fontWeight = "bold";
  element.style.transition = "all 0.2s ease";
  element.style.userSelect = "none";

  const customizeSettings = (textSettings: TextSettings) => {
    const {
      innerHTML,
      backgroundColors = defaultBackgroundColors,
      fontSize = defaultFontSize,
    } = textSettings;
    const oldDisplay = element.style.display;
    element.style.display = "none";
    element.style.fontSize = `${fontSize}px`;
    element.style.backgroundColor = backgroundColors.regular;
    element.innerHTML = innerHTML;
    element.style.display = oldDisplay;
  };
  element.addEventListener("click", async () => {
    await onClick();
    customizeSettings(await getTextSettings());
  });
  customizeSettings(await getTextSettings());
}
