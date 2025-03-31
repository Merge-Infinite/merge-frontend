import { Extendable } from "../../types";

export type GuideContainerProps = Extendable;

export default function VersionGuard(props: GuideContainerProps) {
  return <>{props.children}</>;
}

function getChromeVersion() {
  const userAgent = navigator.userAgent;
  const chromeRegex = /(?:Chrome|Chromium)\/(\d+\.\d+\.\d+\.\d+)/i;
  const match = userAgent.match(chromeRegex);

  if (match !== null) {
    const versionString = match[1];
    return versionString;
  } else {
    return null;
  }
}
