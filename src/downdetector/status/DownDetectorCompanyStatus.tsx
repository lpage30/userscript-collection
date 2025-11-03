import React from "react";
import "../../common/ui/styles.css";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitElementById,
} from "../../common/await_functions";
import { statusElementId, processCompanyStatus } from "../common/CompanyTypes";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../../common/ui/renderRenderable";
import CompanyStatus from "./CompanyStatus";

const renderableId = "downdetector-company-status-panel";
export const DownDetectorCompanyStatus: Userscript = {
  name: "DownDetectorCompanyStatus",

  isSupported: (href: string): boolean =>
    href.includes("downdetector.com/status/") && !href.endsWith('/map/'),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    const status = processCompanyStatus('status',
      await awaitElementById(statusElementId),
      href,
    );
    const container = createRenderableContainerAsChild(
      document.body,
      renderableId,
    );
    renderInContainer(container, <CompanyStatus page={'status'} company={status} />);
    await awaitElementById(renderableId);
  },
};
