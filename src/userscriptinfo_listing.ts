import { UserscriptInfoListing } from "./common/userscript";
import { wordsToTitleCase, splitByCapitals } from "./common/functions";

export const userscriptDirectories = [
  "aiassistantsiteproxy",
  "downdetector",
  "jobcollectoraggregator",
];

async function createUserScriptListing(
  projectDirname: string,
): Promise<UserscriptInfoListing> {
  let result = {};
  for (const scriptDirectory of userscriptDirectories) {
    result = {
      ...result,
      ...(
        await import(
          `${projectDirname}/src/${scriptDirectory}/userscriptinfo_listing.ts`
        )
      ).UserscriptListing,
    };
  }
  return result;
}
let userscriptListing: UserscriptInfoListing | null = null;

export async function getUserscriptListing(
  projectDirname: string,
): Promise<UserscriptInfoListing> {
  if (!userscriptListing) {
    userscriptListing = await createUserScriptListing(projectDirname);
  }
  return userscriptListing;
}

export function createUserscriptIndexPage(
  listing: UserscriptInfoListing,
  distDirectory: string,
): string {
  const KnownAcronyms = ["ai", "AI", "aI", "Ai"];
  return `
<html>
    <title>Userscript Index</title>
    <body>
        <h1>Userscript Index</h1>
        <ul>
${Object.entries(listing)
  .map(
    ([name, { filename }]) =>
      `\t\t\t<li><a href="file://${distDirectory}/${filename}">${wordsToTitleCase(splitByCapitals(name), (word) => KnownAcronyms.includes(word)).join(" ")}</a></li>`,
  )
  .join("\n")}
        </ul>
        <sub>These are locally sourced userscripts. You will need to ensure <br/>
        <b>Extensions|Manage Extensions|TamperMonkey|Details</b> has following settings:
        <ul>
            <li><b>Allow User scripts</b> is enabled</li>
            <li><b>Allow access to file URLs</b> is enabled</li>
        </ul>
        </sub>
    </body>
</html>`;
}
