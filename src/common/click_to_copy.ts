import { awaitDocumentElementFocus } from "./await_functions";
import { mouseDownUpClick, mouseClick, elementClick } from "./click_functions";
export async function clickToCopy(
  clickableElement: HTMLElement,
): Promise<string> {
  await awaitDocumentElementFocus(clickableElement);
  return new Promise<string>((resolve) => {
    const onClipboardChange = (evt: Event): void => {
      console.log(`Clipboard Changed: ${JSON.stringify(evt, null, 2)}`);
      navigator.clipboard.removeEventListener(
        "clipboardchange",
        onClipboardChange,
      );
      navigator.clipboard.readText().then(resolve);
    };
    navigator.clipboard.addEventListener("clipboardchange", onClipboardChange);
    elementClick(clickableElement);
  });
}
