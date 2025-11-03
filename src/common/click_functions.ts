// @grant       unsafeWindow
import { awaitDelay } from "./await_functions";

export async function mouseDownUpClick(
  clickableElement: HTMLElement,
): Promise<void> {
  const clickableBoundingRect = clickableElement.getBoundingClientRect();
  const centerX = clickableBoundingRect.x + clickableBoundingRect.width / 2;
  const centerY = clickableBoundingRect.y + clickableBoundingRect.height / 2;
  const pointerEventProperties = {
    bubbles: true,
    cancelable: true,
    clientX: centerX,
    clientY: centerY,
    button: 0,
    pointerType: "mouse",
    isPrimary: true,
    view: unsafeWindow,
  };

  const mouseDown = new PointerEvent("pointerdown", pointerEventProperties);
  const mouseUp = new PointerEvent("pointerup", pointerEventProperties);
  clickableElement.dispatchEvent(mouseDown);
  await awaitDelay(250);
  clickableElement.dispatchEvent(mouseUp);
  await awaitDelay(250);
}
export async function mouseClick(clickableElement: HTMLElement): Promise<void> {
  const clickableBoundingRect = clickableElement.getBoundingClientRect();
  const centerX = clickableBoundingRect.x + clickableBoundingRect.width / 2;
  const centerY = clickableBoundingRect.y + clickableBoundingRect.height / 2;
  const pointerEventProperties = {
    bubbles: true,
    cancelable: true,
    clientX: centerX,
    clientY: centerY,
    button: 0,
    pointerType: "mouse",
    isPrimary: true,
    view: unsafeWindow,
  };
  const clickEvent = new PointerEvent("click", pointerEventProperties);
  clickableElement.dispatchEvent(clickEvent);
  await awaitDelay(250);
}
export async function elementClick(
  clickableElement: HTMLElement,
): Promise<void> {
  clickableElement.click();
  await awaitDelay(250);
}
