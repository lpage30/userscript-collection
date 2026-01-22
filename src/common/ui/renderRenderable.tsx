import React, { CSSProperties, JSX, ReactNode } from "react";
import "./styles.scss";
import { PrimeReactProvider } from "primereact/api";
import { createRoot } from "react-dom/client";

function wrapWithPrimeReact(renderable: JSX.Element | ReactNode): ReactNode {
  return <PrimeReactProvider>{renderable}</PrimeReactProvider>;
}

export function renderInContainer(
  containerElement: HTMLElement,
  renderable: JSX.Element | ReactNode,
) {
  const root = createRoot(containerElement);
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

export function reactToHTMLElement(elementId: string, jsxElement: JSX.Element | ReactNode, wrappingTagName = 'div'): HTMLElement {
  const wrappingElement = document.createElement(wrappingTagName)
  wrappingElement.id = elementId
  renderInContainer(wrappingElement, jsxElement)
  return wrappingElement
}