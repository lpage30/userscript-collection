import React, { useRef } from "react";
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
): HTMLElement {
  const containerElement =
    document.getElementById(containerId) ?? document.createElement("div");
  containerElement.id = containerId;
  if (containerElement.parentElement) {
    containerElement.parentElement.removeChild(containerElement);
  }
  parentElement.appendChild(containerElement);
  return containerElement;
}
