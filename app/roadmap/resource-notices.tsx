import dynamic from "next/dynamic";
import { hasResourceSourceNotes, isUngradedResource } from "@/lib/resourceLearningScope";

const GuideNotice = dynamic(() => import("@/components/ResourceGuideNotice").then(module => module.ResourceGuideNotice));
const SourceNote = dynamic(() => import("@/components/ResourceSourceNote").then(module => module.ResourceSourceNote));

export function RoadmapResourceNotices({url}: {url: string | null | undefined}) {
  return <>
    {isUngradedResource(url) && <GuideNotice url={url} />}
    {hasResourceSourceNotes(url) && <SourceNote url={url} />}
  </>;
}
