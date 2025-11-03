// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow

declare global {
  interface GM_xmlhttpRequestResponse {
    status: number;
    statusText: string;
    responseHeaders: string;
    responseText: string;
    finalUrl: string;
    readyState: number;
    response?: any; // Depending on the responseType, this could be different
    responseXML?: Document;
  }
  interface GM_xmlhttpRequestProgressResponse
    extends GM_xmlhttpRequestResponse {
    lengthComputable: boolean;
    loaded: number;
    total: number;
  }

  interface GM_xmlhttpRequestDetails {
    method: "GET" | "POST" | "HEAD";
    url: string;
    headers?: { [key: string]: string };
    data?: string;
    binary?: boolean;
    timeout?: number;
    onload?: (response: GM_xmlhttpRequestResponse) => void;
    onerror?: (response: GM_xmlhttpRequestResponse) => void;
    onabort?: () => void;
    ontimeout?: () => void;
    onprogress?: (response: GM_xmlhttpRequestProgressResponse) => void;
    upload?: {
      onprogress?: (response: GM_xmlhttpRequestProgressResponse) => void;
    };
    // Add other properties as needed based on your specific Greasemonkey/Tampermonkey environment
  }

  function GM_addValueChangeListener(
    name: string,
    listener: (
      name: string,
      oldValue: any,
      newValue: any,
      remote: boolean,
    ) => void,
  ): string;
  function GM_removeValueChangeListener(listenerId: string): void;
  function GM_setValue(name: string, value: any): void;
  function GM_getValue(name: string, defaultValue?: any): any;
  function GM_deleteValue(name: string): void;
  function GM_xmlhttpRequest(details: GM_xmlhttpRequestDetails): void;
  const unsafeWindow: Window;
}
export {};
