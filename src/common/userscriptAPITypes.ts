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
    binary?: boolean;
    context?: any
    data?: string;
    headers?: { [key: string]: string };
    method: "GET" | "POST" | "HEAD";
    overrideMimeType?: string
    password?: string
    responseType?: '' | 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'ms-stream'
    synchronous?: boolean
    timeout?: number
    url: string
    user?: string
    onabort?: () => void;
    onerror?: (response: GM_xmlhttpRequestResponse) => void;
    onload?: (response: GM_xmlhttpRequestResponse) => void;
    onprogress?: (response: GM_xmlhttpRequestProgressResponse) => void;
    onreadystatechange?: (response: GM_xmlhttpRequestResponse) => void;
    ontimeout?: (response: GM_xmlhttpRequestResponse) => void;
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
  function GM_openInTab(url: string, options?: { active?: boolean, insert?: number, setParent?: boolean, incognito?: boolean, pinned?: boolean, container?: number }): {
    closed: boolean
    close: () => void
  } | null
  const unsafeWindow: Window;

  interface GMInfoUADataValues {
    brands?: {
      brand: string;
      version: string;
    }[],
    mobile?: boolean,
    platform?: string,
    architecture?: string,
    bitness?: string
  }
  interface GMInfoScriptResource {
    name: string,
    url: string,
    error?: string,
    content?: string,
    meta?: string
  }
  interface GMInfoScriptWebRequestRule {
    selector: { include?: string | string[], match?: string | string[], exclude?: string | string[] } | string,
    action: string | {
      cancel?: boolean,
      redirect?: {
        url: string,
        from?: string,
        to?: string
      } | string
    }
  }
  interface GMInfoScriptOptionsOverride {

    use_includes: string[],
    orig_includes: string[],
    merge_includes: boolean,
    use_matches: string[],
    orig_matches: string[],
    merge_matches: boolean,
    use_excludes: string[],
    orig_excludes: string[],
    merge_excludes: boolean,
    use_connects: string[],
    orig_connects: string[],
    merge_connects: boolean,
    use_blockers: string[],
    orig_run_at: string | null,
    orig_run_in: string[] | null, // 5.3+
    orig_noframes: boolean | null

  }
  interface GMInfoScriptOptions {
    check_for_updates: boolean,
    comment: string | null,
    compatopts_for_requires: boolean,
    compat_wrappedjsobject: boolean,
    compat_metadata: boolean,
    compat_foreach: boolean,
    compat_powerful_this: boolean | null,
    sandbox: string | null,
    noframes: boolean | null,
    unwrap: boolean | null,
    run_at: string | null,
    run_in: string | null, // 5.3+
    override: GMInfoScriptOptionsOverride
  }
  interface GMInfoScript {
    antifeatures: { [antifeature: string]: { [locale: string]: string } },
    author: string | null,
    blockers: string[],
    connects: string[],
    copyright: string | null,
    deleted?: number | undefined,
    description_i18n: { [locale: string]: string } | null,
    description: string,
    downloadURL: string | null,
    excludes: string[],
    fileURL: string | null,
    grant: string[],
    header: string | null,
    homepage: string | null,
    icon: string | null,
    icon64: string | null,
    includes: string[],
    lastModified: number,
    matches: string[],
    name_i18n: { [locale: string]: string } | null,
    name: string,
    namespace: string | null,
    position: number,
    resources: GMInfoScriptResource[],
    supportURL: string | null,
    system?: boolean | undefined,
    'run-at': string | null,
    'run-in': string[] | null, // 5.3+
    unwrap: boolean | null,
    updateURL: string | null,
    version: string,
    webRequest: GMInfoScriptWebRequestRule[] | null,
    options: GMInfoScriptOptions
  }

  const GM_info: {
    container?: { // 5.3+ | Firefox only
      id: string,
      name?: string
    },
    downloadMode: string,
    isFirstPartyIsolation?: boolean,
    isIncognito: boolean,
    sandboxMode: string
    scriptHandler: string,
    scriptMetaStr: string | null,
    scriptUpdateURL: string | null,
    scriptWillUpdate: boolean,
    userAgentData: GMInfoUADataValues, // 4.19+
    version?: string,
    script: GMInfoScript
  }
}
export { };
