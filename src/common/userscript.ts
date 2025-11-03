export interface Userscript {
  name: string;
  isSupported: (href: string) => boolean;
  render: (href: string) => Promise<void>;
}

export interface UserscriptHeaderInfo {
  name: string;
  description: string;
  version: string;
  includes: string[];
  matches: string[];
  grants: string[];
}
export interface UserscriptInfo {
  name: string;
  filename: string;
  headerFilepath: string;
  entryFilepath: string;
  headerInfo?: UserscriptHeaderInfo;
}
export type UserscriptInfoListing = { [name: string]: UserscriptInfo };
