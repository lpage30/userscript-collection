import React, { CSSProperties, useRef } from "react";
import "./styles.css";
import { PrimeReactProvider } from "primereact/api";
import { createRoot } from "react-dom/client";

function wrapWithPrimeReact(renderable: any) {
  return <PrimeReactProvider>{renderable}</PrimeReactProvider>;
}

export function renderInContainer(
  containerElement: HTMLElement,
  renderable: any,
) {
  const root = createRoot(containerElement as any);
  root.render(wrapWithPrimeReact(renderable));
  return containerElement;
}

export function createRenderableContainerAsChild(
  parentElement: HTMLElement,
  containerId: string,
  options?: {
    atFront?: boolean,
    containerStyle?: CSSProperties
  }
): HTMLElement {
  const { atFront, containerStyle } = options ?? {}
  const containerElement = document.getElementById(containerId) ?? document.createElement("div");
  containerElement.id = containerId;
  if (containerStyle) {
    for(const key in containerStyle) {
      if (Object.prototype.hasOwnProperty.call(containerStyle, key)) {
        containerElement.style[key] = containerStyle[key]
      }
    }
  }
  if (containerElement.parentElement) {
    containerElement.parentElement.removeChild(containerElement);
  }
  if (atFront === true) {
    parentElement.insertBefore(containerElement, parentElement.firstChild)
  } else {
    parentElement.appendChild(containerElement);
  }
  return containerElement;
}
