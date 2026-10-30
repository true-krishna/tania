import type { CvFieldsFragment } from "@/generated/graphql";
import { CvCertificationsSection } from "./CvCertificationsSection";
import { CvEducationsSection } from "./CvEducationsSection";
import { CvSkillsSection } from "./CvSkillsSection";
import { CvSummarySection } from "./CvSummarySection";
import { CvWorkExperienceSection } from "./CvWorkExperienceSection";

export function CvEditorSections({ cv }: { cv: CvFieldsFragment | undefined }) {
  return (
    <>
      <CvSummarySection cv={cv} />
      <CvEducationsSection cv={cv} />
      <CvCertificationsSection cv={cv} />
      <CvSkillsSection cv={cv} />
      <CvWorkExperienceSection cv={cv} />
    </>
  );
}
