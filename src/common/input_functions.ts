export function dispatchInput(input: string, element: HTMLElement) {
  element.innerText = input;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}
