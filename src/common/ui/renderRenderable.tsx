import React, { CSSProperties, useRef, JSX } from "react";
import { renderToStaticMarkup } from 'react-dom/server';
import "./styles.scss";
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
    after?: HTMLElement,
    containerStyle?: CSSProperties
  }
): HTMLElement {
  const { atFront, after, containerStyle } = options ?? {}
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
  } else if (after) {
    parentElement.insertBefore(containerElement, after)
  } else {
    parentElement.appendChild(containerElement);
  }
  return containerElement;
}

export function reactToHTMLElement(elementId: string, jsxElement: JSX.Element, wrappingTagName = 'div'): HTMLElement {
  const wrappingElement = document.createElement(wrappingTagName)
  wrappingElement.id = elementId
  wrappingElement.innerHTML = renderToStaticMarkup(jsxElement)
  return wrappingElement
}