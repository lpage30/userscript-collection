import { ChatRequest } from "../AIClient";
import { AISite } from "./aisite";
import {
  GMMessageBroker,
  getGMMessageBrokerInstance,
} from "../../common/GMMessageBroker";
import { toString } from "../../common/functions";

export class SiteAgent {
  private broker: GMMessageBroker | null;
  private site: AISite | null;
  private keepAliveIntervalms: number;
  private keepAliveExpiredms: number;
  constructor(config: {
    keepAliveIntervalms: number;
    keepAliveExpiredms: number;
  }) {
    this.broker = null;
    this.site = null;
    this.keepAliveIntervalms = config.keepAliveIntervalms;
    this.keepAliveExpiredms = config.keepAliveExpiredms;
  }
  start(site: AISite) {
    if (this.broker === null) {
      this.site = site;
      if (this.site) {
        this.broker = getGMMessageBrokerInstance(
          this.keepAliveIntervalms,
          this.keepAliveExpiredms,
        ).startServer("AIAssistantProxy", this.site.name);
        this.broker.subscribe("ask", async (request: any) => {
          try {
            const response = await this.site?.ask(request as ChatRequest);
            this.broker?.emit("ask", response);
          } catch (e) {
            const message = `Failed asking question of ${this.site?.name}. ${toString(e)}`;
            console.error(message, e);
            this.broker?.emit("ask", { error: message });
          }
        });
      } else {
        throw new Error(`Site not supported`);
      }
    }
  }
  stop() {
    if (this.broker) {
      this.broker.stop();
      this.broker = null;
      this.site = null;
    }
  }
}
