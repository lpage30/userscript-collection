const isLoadComplete = (): boolean => document.readyState === "complete";

export async function awaitCondition(
  testCondition: () => boolean,
  options: { maxRetries: number; intervalMs: number } = {
    maxRetries: 60,
    intervalMs: 250,
  },
) {
  let interval: any = null;
  let tries = 0;

  const trial = (
    resolve: () => void,
    reject: (error: Error) => void,
  ): void => {
    if (tries >= options.maxRetries) {
      clearInterval(interval);
      reject(
        new Error(`awaitCondition(${testCondition.toString()}) failed after ${tries}`),
      );
      return;
    }
    tries++;
    if (testCondition()) {
      clearInterval(interval);
      resolve();
    }
  };

  return new Promise<void>((resolve, reject) => {
    tries = 0;
    interval = setInterval(() => trial(resolve, reject), options.intervalMs);
  });
}
export async function awaitPageLoadByEvent() {
  if (isLoadComplete()) return;
  await new Promise((resolve) => {
    window.addEventListener("load", resolve, { once: true });
  });
}

export async function awaitPageLoadByMutation(timeout = 10000): Promise<void> {
  if (isLoadComplete()) return;
  await new Promise<void>((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (isLoadComplete()) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timeout waiting for page mutation"));
    }, timeout);
  });
}

export async function awaitQuerySelection(
  selectors: string,
  options: { maxRetries: number; intervalMs: number } = {
    maxRetries: 60,
    intervalMs: 250,
  },
): Promise<HTMLElement> {
  let interval: any = null;
  let tries = 0;

  const trial = (
    resolve: (value: HTMLElement) => void,
    reject: (error: Error) => void,
  ): void => {
    if (tries >= options.maxRetries) {
      clearInterval(interval);
      reject(
        new Error(`awaitQuerySelection(${selectors}) failed after ${tries}`),
      );
      return;
    }
    tries++;
    const element = document.querySelector(selectors);
    if (element) {
      clearInterval(interval);
      resolve(element as HTMLElement);
    }
  };

  return new Promise<HTMLElement>((resolve, reject) => {
    tries = 0;
    interval = setInterval(() => trial(resolve, reject), options.intervalMs);
  });
}

export async function awaitQueryAll(
  selectors: string,
  options: { maxRetries: number; intervalMs: number } = {
    maxRetries: 60,
    intervalMs: 250,
  },
): Promise<HTMLElement[]> {
  let interval: any = null;
  let tries = 0;

  const trial = (
    resolve: (value: HTMLElement[]) => void,
    reject: (error: Error) => void,
  ): void => {
    if (tries >= options.maxRetries) {
      clearInterval(interval);
      reject(
        new Error(`awaitQuerySelection(${selectors}) failed after ${tries}`),
      );
      return;
    }
    tries++;
    const element = document.querySelectorAll(selectors);
    if (element) {
      clearInterval(interval);
      resolve(Array.from(element) as HTMLElement[]);
    }
  };

  return new Promise<HTMLElement[]>((resolve, reject) => {
    tries = 0;
    interval = setInterval(() => trial(resolve, reject), options.intervalMs);
  });
}

export async function awaitElementById(
  elementId: string,
  options: { minChildCount: number; maxRetries: number; intervalMs: number } = {
    minChildCount: 0,
    maxRetries: 60,
    intervalMs: 250,
  },
): Promise<HTMLElement> {
  let interval: any = null;
  let tries = 0;

  const trial = (
    resolve: (value: HTMLElement) => void,
    reject: (error: Error) => void,
  ): void => {
    if (tries >= options.maxRetries) {
      clearInterval(interval);
      reject(new Error(`awaitElementById(${elementId}) failed after ${tries}`));
      return;
    }
    tries++;
    const element = document.getElementById(elementId);
    if (element) {
      clearInterval(interval);
      resolve(element as HTMLElement);
    }
  };

  return new Promise<HTMLElement>((resolve, reject) => {
    tries = 0;
    interval = setInterval(() => trial(resolve, reject), options.intervalMs);
  });
}

export async function awaitDocumentElementFocus(
  element: HTMLElement,
  options: { maxRetries: number; intervalMs: number } = {
    maxRetries: 60,
    intervalMs: 250,
  },
): Promise<void> {
  let interval: any = null;
  let tries = 0;
  const trial = async (
    resolve: () => void,
    reject: (error: Error) => void,
  ): Promise<void> => {
    tries++;
    if (document.hasFocus() && document.activeElement == element) {
      clearInterval(interval);
      resolve();
      return;
    }
    if (tries >= options.maxRetries) {
      clearInterval(interval);
      reject(new Error(`awaitDocumentFocus failed after ${tries}`));
      return;
    }
    element.focus();
  };

  return new Promise<void>((resolve, reject) => {
    tries = 0;
    interval = setInterval(() => trial(resolve, reject), options.intervalMs);
  });
}

export async function awaitDelay(delayMS: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMS));
}
