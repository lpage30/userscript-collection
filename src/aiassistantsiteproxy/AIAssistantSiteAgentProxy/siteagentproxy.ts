import { ChatRequest, ChatResponse } from "../AIClient";
import {
  GMMessageBroker,
  getGMMessageBrokerInstance,
} from "../../common/GMMessageBroker";
import { getAISiteType } from "../AIAssistantSiteAgent/sites/sites";

export interface ConnectedSite {
  site: string;
  lastAliveTime: number;
}

export class SiteAgentProxy {
  private broker: GMMessageBroker | null;
  private keepAliveIntervalms: number;
  private keepAliveExpiredms: number;
  constructor(config: {
    keepAliveIntervalms: number;
    keepAliveExpiredms: number;
  }) {
    this.broker = null;
    this.keepAliveIntervalms = config.keepAliveIntervalms;
    this.keepAliveExpiredms = config.keepAliveExpiredms;
  }
  async ask(request: ChatRequest) {
    if (this.broker === null) {
      throw new Error(`GMMessageBroker isn't started`);
    }
    await this.broker.emit("ask", request);
  }
  getConnectedSites(): ConnectedSite[] {
    if (this.broker) {
      return Object.entries(this.broker.conections().clients)
        .map(([href, lastAliveTime]) => ({
          site: getAISiteType(href),
          lastAliveTime,
        }))
        .filter((value): value is ConnectedSite => value.site !== null);
    }
    return [];
  }

  start(responseHandler: (response: ChatResponse | { error: string }) => void) {
    if (this.broker === null) {
      this.broker = getGMMessageBrokerInstance(
        this.keepAliveIntervalms,
        this.keepAliveExpiredms,
      ).startServer("AIAssistantProxy", "client");
      this.broker.subscribe("ask", (response: any) =>
        responseHandler(response),
      );
    }
  }
  stop() {
    if (this.broker) {
      this.broker.stop();
      this.broker = null;
    }
  }
}
