import React, { useRef, JSX } from "react";
import "./styles.scss";
import ReactDomServer from "react-dom/server";
import DOMPurify from "dompurify";
import ParseHTMLToReact from 'html-react-parser'

let trustedTypesPolicy: any;
function getTrustedTypesPolicy() {
  if (trustedTypesPolicy) {
    return trustedTypesPolicy;
  }
  trustedTypesPolicy =
    typeof window == "undefined" || !(window as any).trustedTypes
      ? { createHTML: (htmlString: string) => DOMPurify.sanitize(htmlString) }
      : !(window as any).trustedTypes.defaultPolicy
        ? (window as any).trustedTypes.createPolicy(`default`, {
            createHTML: (htmlString: string) => DOMPurify.sanitize(htmlString),
          })
        : (window as any).trustedTypes.defaultPolicy;
  return getTrustedTypesPolicy();
}
export function reactToHTMLString(renderable: any) {
  return getTrustedTypesPolicy().createHTML(
    ReactDomServer.renderToString(renderable),
  );
}

export function htmlStringToReact(htmlString: string): string | JSX.Element | JSX.Element[] {
  return ParseHTMLToReact(htmlString)
}
export function htmlStringToElement(elementId: string, htmlString: string, wrappingTagName = 'div'): HTMLElement {
    const wrappingElement = document.createElement(wrappingTagName)
    wrappingElement.id = elementId
    wrappingElement.innerHTML = htmlString
    return wrappingElement
}