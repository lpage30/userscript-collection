import React, { useRef } from "react";
import "./styles.css";
import ReactDomServer from "react-dom/server";
import DOMPurify from "dompurify";

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
