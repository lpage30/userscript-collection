// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @grant       GM_setValue
// @grant       GM_getValue
import { toHashCode, isEmpty, toString } from "./functions";
import { awaitDelay } from "./await_functions";

const debug = false;
const debugLog = (message: string) => {
  if (debug) console.log(message);
};
const log = (message: string) => console.log(message);

const clientName = "GMMessageBrokerClient";
const serverName = "GMMessageBrokerServer";
const IAmAliveTopic = "IAmAlive";

const toSubscriptionId = (topic: string, onTopicHandler: OnTopicHandler) =>
  toHashCode(`${topic}|${toString(onTopicHandler)}`);

export enum BrokerType {
  SERVER = "SERVER",
  CLIENT = "CLIENT",
}
export type OnTopicHandler = (data: unknown) => Promise<void> | void;
export interface Connections {
  servers: { [key: string]: number };
  clients: { [key: string]: number };
}
export interface GMMessageBroker {
  isServerType(): boolean;
  isRunning(): boolean;
  conections(): Connections;
  startServer(name: string, siteName: string): GMMessageBroker;
  startClient(name: string, siteName: string): GMMessageBroker;
  start(
    name: string,
    brokerType: BrokerType,
    siteName: string,
  ): GMMessageBroker;
  stop(): void;
  subscribe(
    topic: string,
    onTopicHandler: OnTopicHandler,
  ): Promise<{ topic: string; subscriptionId: string }>;
  unsubscribe(topic: string, subscriberId: string): void;
  emit(topic: string, data: any): Promise<void>;
  requestResponse(topic: string, request: any, timeoutms: number): Promise<any>;
  requestResponseWithRetry(
    topic: string,
    request: any,
    options: { timeoutms?: number; maxRetries?: number },
  ): Promise<any>;
}

class GMMessageBase {
  type: BrokerType;
  emitName: string;
  listenName: string;
  name: string;
  listenerId: string | null;
  topicHandlers: {
    [key: string]: {
      [key: string]: {
        subscriptionId: string;
        topic: string;
        handler: OnTopicHandler;
      };
    };
  };
  messageRatems: number;
  lastMessageEmitTime: number;
  brokerConnections: Connections;
  keepAliveIntervalId: any;
  keepAliveIntervalms: number;
  keepAliveExpiredms: number;

  constructor(
    name: string,
    type: BrokerType,
    emitName: string,
    listenName: string,
    keepAliveIntervalms: number,
    keepAliveExpiredms: number,
  ) {
    const currentHref = window.location.href;
    const currentTime = Date.now();
    this.type = type;
    this.emitName = emitName;
    this.listenName = listenName;
    this.name = name;
    this.listenerId = null;
    this.topicHandlers = {};
    this.messageRatems = 1000;
    this.lastMessageEmitTime = 0;
    this.keepAliveIntervalms = keepAliveIntervalms;
    this.keepAliveExpiredms = keepAliveExpiredms;
    this.keepAliveIntervalId = null;

    this.brokerConnections = {
      servers: type == BrokerType.SERVER ? { [currentHref]: currentTime } : {},
      clients: type == BrokerType.CLIENT ? { [currentHref]: currentTime } : {},
    };
  }
  get isRunning() {
    return !isEmpty(this.listenerId);
  }
  get isServer() {
    return this.type == BrokerType.SERVER;
  }
  get isClient() {
    return this.type == BrokerType.CLIENT;
  }
  get connections() {
    return this.brokerConnections;
  }
  onKeepAlive(href: string) {
    const currentHref = window.location.href;
    const currentTime = Date.now();
    const expireTime = currentTime - this.keepAliveExpiredms;
    this.brokerConnections = {
      servers: Object.entries(this.brokerConnections.servers)
        .filter(([key, time]) => time >= expireTime)
        .reduce(
          (nameValue: { [key: string]: number }, [key, time]) => ({
            ...nameValue,
            [key]: time,
          }),
          {},
        ),
      clients: Object.entries(this.brokerConnections.clients)
        .filter(([key, time]) => time >= expireTime)
        .reduce(
          (nameValue: { [key: string]: number }, [key, time]) => ({
            ...nameValue,
            [key]: time,
          }),
          {},
        ),
    };
    if (this.isClient) {
      this.brokerConnections = {
        ...this.brokerConnections,
        servers: {
          ...this.brokerConnections.servers,
          [href]: currentTime,
        },
        clients: { [currentHref]: currentTime },
      };
    }
    if (this.isServer) {
      this.brokerConnections = {
        ...this.brokerConnections,
        servers: { [currentHref]: currentTime },
        clients: {
          ...this.brokerConnections.clients,
          [href]: currentTime,
        },
      };
    }
  }
  keepAlive() {
    const currentHref = window.location.href;
    this.emit(IAmAliveTopic, currentHref);
  }
  start(): boolean {
    if (this.isRunning) {
      return true;
    }
    GM_setValue(this.listenName, "running");
    this.listenerId = GM_addValueChangeListener(
      this.listenName,
      async (name: string, oldValue: any, newValue: any, remote: boolean) => {
        const { topic, data, timestampms } = newValue;
        if (topic === IAmAliveTopic) {
          this.onKeepAlive(data);
          return;
        }
        debugLog(
          `${this.name}-RECEIVE[${this.listenName}] -> callback(key(${name}),oldValue(${oldValue}),event({topic: ${topic}, timestampms: ${timestampms}}),remote(${remote}))`,
        );
        if (isEmpty(this.topicHandlers[topic])) {
          return;
        }
        for (const subscriptionId of Object.keys(this.topicHandlers[topic])) {
          debugLog(
            `${this.name}-GMMessageBroker routing ${topic} data to subscription: ${subscriptionId}`,
          );
          await this.topicHandlers[topic][subscriptionId].handler(data);
        }
      },
    );
    debugLog(`${this.name}-GM_addValueChangeListener(${this.listenName})`);
    if (0 < this.keepAliveIntervalms) {
      this.keepAliveIntervalId = setInterval(
        () => this.keepAlive(),
        this.keepAliveIntervalms,
      );
    }
    log(`${this.name}-GMMessageBroker running as ${this.type.toString()}`);
    return true;
  }

  stop(): void {
    if (this.isRunning) {
      GM_removeValueChangeListener(this.listenerId ?? "");
      this.listenerId = null;
      if (null !== this.keepAliveIntervalId) {
        clearInterval(this.keepAliveIntervalId);
        this.keepAliveIntervalId = null;
      }
      debugLog(`${this.name}-GM_removeValueChangeListener(${this.listenName})`);
      log(`${this.name}-GMMessageBroker stopped as ${this.type.toString()}`);
    }
  }

  async subscribe(
    topic: string,
    onTopicHandler: OnTopicHandler,
  ): Promise<{ topic: string; subscriptionId: string }> {
    if (!this.isRunning) {
      throw new Error("Failed subscribe. GMMessageBroker is not running.");
    }
    if (isEmpty(this.topicHandlers[topic])) {
      this.topicHandlers[topic] = {};
    }
    const subscriptionId = toSubscriptionId(topic, onTopicHandler);
    this.topicHandlers[topic][subscriptionId] = {
      subscriptionId,
      topic,
      handler: onTopicHandler,
    };
    debugLog(
      `${this.name}-GMMessageBroker.subscribe(${topic}) subscription ${subscriptionId}`,
    );
    return {
      topic,
      subscriptionId,
    };
  }

  unsubscribe(topic: string, subscriptionId: string): void {
    delete this.topicHandlers[topic][subscriptionId];
    if (Object.keys(this.topicHandlers[topic]).length === 0) {
      delete this.topicHandlers[topic];
    }
    debugLog(
      `${this.name}-GMMessageBroker.unsubscribed(${subscriptionId}) for ${topic}${isEmpty(this.topicHandlers[topic]) ? " (no more subscriptions)" : ""}`,
    );
  }

  async emit(topic: string, data: any): Promise<void> {
    if (!this.isRunning) {
      throw new Error("Failed emit. GMMessageBroker is not running.");
    }
    const value = { topic, data, timestampms: Date.now() };
    // throttle messages
    const waitms = this.messageRatems - (Date.now() - this.lastMessageEmitTime);
    if (0 < waitms) {
      // throttle if too soon
      await awaitDelay(waitms);
    }
    GM_setValue(this.emitName, value);
    this.lastMessageEmitTime = Date.now();
    debugLog(`${this.name}-SEND[${this.emitName}] -> ${toString(value)})`);
  }

  async requestResponse(
    topic: string,
    request: any,
    timeoutms = 10000,
  ): Promise<any> {
    if (!this.isRunning) {
      throw new Error(
        "Failed requestResponse. GMMessageBroker is not running.",
      );
    }
    const waitms = this.messageRatems - (Date.now() - this.lastMessageEmitTime);
    if (0 < waitms) {
      // throttle if too soon
      await awaitDelay(waitms);
    }
    return new Promise(async (resolve, reject) => {
      let timeoutId: any = 0;
      let unsubscribe: () => void = () => {};
      const resolveResponse = (response: any) => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(response);
      };
      unsubscribe = () =>
        this.unsubscribe(
          topic,
          toSubscriptionId(topic, resolveResponse as OnTopicHandler),
        );

      this.subscribe(topic, resolveResponse as OnTopicHandler);

      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Timedout (${timeoutms}ms) waiting for response to ${topic} request`,
          ),
        );
      }, timeoutms);
      await this.emit(topic, request);
    });
  }
  async requestResponseWithRetry(
    topic: string,
    request: any,
    options: { timeoutms?: number; maxRetries?: number } = {
      timeoutms: 1000,
      maxRetries: 1,
    },
  ): Promise<any> {
    if (!this.isRunning) {
      throw new Error(
        "Failed requestResponseWithRetry. GMMessageBroker is not running.",
      );
    }
    let attempt = 0;
    const maxRetries = options.maxRetries ?? 1;
    const timeoutms = options.timeoutms ?? 1000;
    while (attempt < maxRetries) {
      try {
        const response = await this.requestResponse(topic, request, timeoutms);
        return response;
      } catch (e) {
        attempt = attempt + 1;
        if (attempt >= maxRetries) {
          throw e;
        }
        debugLog(
          `Failed requestResponse[${attempt - 1}/${options.maxRetries}] (${toString(e)}) retrying...`,
        );
      }
    }
  }
}
class GMMessageClient extends GMMessageBase {
  constructor(
    name: string,
    siteName: string,
    keepAliveIntervalms: number,
    keepAliveExpiredms: number,
  ) {
    super(
      isEmpty(siteName) ? name : `${name}[${siteName}]`,
      BrokerType.CLIENT,
      serverName,
      clientName,
      keepAliveIntervalms,
      keepAliveExpiredms,
    );
  }
}
class GMMessageServer extends GMMessageBase {
  constructor(
    name: string,
    siteName: string,
    keepAliveIntervalms: number,
    keepAliveExpiredms: number,
  ) {
    super(
      isEmpty(siteName) ? name : `${name}[${siteName}]`,
      BrokerType.SERVER,
      clientName,
      serverName,
      keepAliveIntervalms,
      keepAliveExpiredms,
    );
  }
}
class GMMessageBrokerClass implements GMMessageBroker {
  private broker: GMMessageBase | null;
  private keepAliveIntervalms: number;
  private keepAliveExpiredms: number;

  constructor(keepAliveIntervalms: number, keepAliveExpiredms: number) {
    this.broker = null;
    this.keepAliveIntervalms = keepAliveIntervalms;
    this.keepAliveExpiredms = keepAliveExpiredms;
  }

  isServerType(): boolean {
    return this.broker !== null && this.broker.isServer;
  }

  isRunning(): boolean {
    return this.broker !== null && this.broker.isRunning;
  }
  conections(): Connections {
    return this.broker !== null
      ? this.broker.connections
      : {
          servers: {},
          clients: {},
        };
  }
  startServer(name: string, siteName: string = ""): GMMessageBroker {
    if (this.broker === null) {
      this.broker = new GMMessageServer(
        name,
        siteName,
        this.keepAliveIntervalms,
        this.keepAliveExpiredms,
      );
    } else if (this.broker.isClient) {
      throw new Error("GMMessageBroker already started as client");
    }
    this.broker.start();
    return this;
  }

  startClient(name: string, siteName: string = ""): GMMessageBroker {
    if (this.broker === null) {
      this.broker = new GMMessageClient(
        name,
        siteName,
        this.keepAliveIntervalms,
        this.keepAliveExpiredms,
      );
    } else if (this.broker.isServer) {
      throw new Error("GMMessageBroker already started as Server");
    }
    this.broker.start();
    return this;
  }

  start(
    name: string,
    brokerType: BrokerType,
    siteName: string = "",
  ): GMMessageBroker {
    if (isEmpty(brokerType)) {
      throw new Error(
        `missing broker type "${brokerType}". Supported types: "${["SERVER", "CLIENT"].join('", "')}"`,
      );
    }
    switch (brokerType) {
      case BrokerType.SERVER:
        return this.startServer(name, siteName);
      case BrokerType.CLIENT:
        return this.startClient(name, siteName);
      default:
        throw new Error(
          `Unsupported "${brokerType}". Supported types: "${["SERVER", "CLIENT"].join('", "')}"`,
        );
    }
  }

  stop(): void {
    if (this.isRunning() && this.broker !== null) {
      this.broker.stop();
      this.broker = null;
    }
  }

  async subscribe(
    topic: string,
    onTopicHandler: OnTopicHandler,
  ): Promise<{ topic: string; subscriptionId: string }> {
    if (!this.isRunning() || this.broker === null) {
      throw new Error("Failed subscribe. GMMessageBroker is not running.");
    }
    return this.broker.subscribe(topic, onTopicHandler);
  }

  unsubscribe(topic: string, subscriptionId: string): void {
    if (this.broker) {
      this.broker.unsubscribe(topic, subscriptionId);
    }
  }

  async emit(topic: string, data: any): Promise<any> {
    if (!this.isRunning() || this.broker === null) {
      throw new Error("Failed emit. GMMessageBroker is not running.");
    }
    await this.broker.emit(topic, data);
  }

  async requestResponse(
    topic: string,
    request: any,
    timeoutms = 10000,
  ): Promise<any> {
    if (!this.isRunning() || this.broker === null) {
      throw new Error(
        "Failed requestResponse. GMMessageBroker is not running.",
      );
    }
    return this.broker.requestResponse(topic, request, timeoutms);
  }

  async requestResponseWithRetry(
    topic: string,
    request: any,
    options: { timeoutms?: number; maxRetries?: number } = {
      timeoutms: 1000,
      maxRetries: 1,
    },
  ): Promise<any> {
    if (!this.isRunning() || this.broker === null) {
      throw new Error(
        "Failed requestResponseWithRetry. GMMessageBroker is not running.",
      );
    }
    return this.broker.requestResponseWithRetry(topic, request, options);
  }
}
let BROKER: GMMessageBrokerClass;
export function getGMMessageBrokerInstance(
  keepAliveIntervalms: number,
  keepAliveExpiredms: number,
): GMMessageBroker {
  if (isEmpty(BROKER)) {
    BROKER = new GMMessageBrokerClass(keepAliveIntervalms, keepAliveExpiredms);
  }
  return BROKER;
}
