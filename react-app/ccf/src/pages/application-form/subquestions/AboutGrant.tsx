import React, { useEffect, useState } from "react";
import "./SubForm.css";
import MarkdownPreviewer from "../../../components/markdown/Markdown";
import { ApplicationAboutType, AboutPage } from "../../../types/aboutTypes";
import { getAboutPages, getDefaultAboutPage } from "../../../backend/about-handler";

type AboutGrantProps = {
    type: "Research" | "NextGen" | "NonResearch";
    formData: {
      title: string;
      principalInvestigator?: string;
      typesOfCancerAddressed?: string;
      institution: string;
      institutionAddress?: string;
      institutionPhoneNumber: string;
      institutionEmail: string;
      adminOfficialName?: string;
      adminOfficialAddress?: string;
      adminPhoneNumber?: string;
      adminEmail?: string;
      includedPublishedPaper?: string;
      creditAgreement?: string;
      patentApplied?: string;
      includedFundingInfo?: string;
      amountRequested: string;
      dates?: string;
      continuation?: string;
      file: File | null;
      requester?: string;
      explanation?: string;
      sources?: string;
      timeframe?: string;
      additionalInfo?: string;
    };
  };

function AboutGrant({ type, formData }: AboutGrantProps): JSX.Element {
  const [aboutContent, setAboutContent] = useState<string>("");

  useEffect(() => {
    const loadAbout = async () => {
      try {
        const pages = await getAboutPages();
        const map: Record<ApplicationAboutType, AboutPage | null> = {
          Research: null,
          NextGen: null,
          NonResearch: null,
        };
        pages.forEach((p) => {
          map[p.id] = p;
        });
        const key = type as ApplicationAboutType;
        const page = map[key];
        if (page && page.content) {
          setAboutContent(page.content);
          return;
        }
      } catch (e) {
        console.error("Error loading About page content:", e);
      }

      // Fallback to existing static text if nothing is configured in Firestore
      const fallbackKey = type as ApplicationAboutType;
      const fallbackPage = getDefaultAboutPage(fallbackKey);
      setAboutContent(fallbackPage.content);
    };

    loadAbout();
  }, [type]);

  return (
    <div className="review-form-container">
      <div className="proposal-text">
        <MarkdownPreviewer _previewOnly={true} _text={aboutContent} _minRows={8} />
      </div>
    </div>
  );
}

export default AboutGrant;
