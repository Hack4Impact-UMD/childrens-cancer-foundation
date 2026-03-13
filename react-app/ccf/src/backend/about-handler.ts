import { collection, getDocs, query, doc, setDoc } from "firebase/firestore";
import { db } from "../index";
import { AboutPage, ApplicationAboutType } from "../types/aboutTypes";

const COLLECTION_NAME = "AboutPages";

// Default content matching the original static About pages
const defaultResearchContent = `
**About the CCF Research Award**

CCF welcomes meritorious laboratory and clinical research proposals relevant to pediatric cancer research. Grants will be awarded for a period of one year, beginning November 2023. The budget amount for Research grants is $75,000.

CCF provides grants in support of pediatric cancer research in the Maryland/DC/Northern Virginia area.

**Citizenship**

At the time of application, candidates must be U.S. citizens, foreign nationals holding either a permanent resident (I-551 or Green Card) or a USCIS-issued I-551 temporary evidence stamp in one’s passport, or foreign nationals with J1 or H1B visas that extend beyond the life of the grant. All foreign nationals must submit, with the application, notarized evidence of this status. At the time of application and throughout the award, an applicant must be employed by a U.S. institution.

**Selection Process and Award Details**

Grant Proposals are reviewed by an independent Selection Committee. All submitted grants will receive a score and overall critique. Notification of Grant Award will be made by August 2023, and formal agreements will follow. Award checks will be presented to recipients at the CCF Gala on November 4, 2023.

The Selection Committee reserves the right to determine applicant’s eligibility based on the information and justifications included in the application materials.

Applicants MAY be involved in other research grants, but there must be clear documentation of mechanisms to avoid scientific and/or budgetary overlap.

There will be multiple Research Grants awarded for 2023 with a maximum award amount of $75,000. The Grant will be awarded for a period of one (1) year only, but the Research Award Winner will be encouraged to apply for CCF funding in subsequent year(s).

**2023 CCF Grant Submission Process**

Please ensure that the following elements are included with the proposal:

- Cover Sheet (enclosed), completely filled out, including Department Chair signature
- All appropriate Biosketches
- Current and pending Grant disclosure, particularly those with overlapping scientific aims

**Requirements**

The obligations of grant awardees after notification are:

- Submission of a two (2) page report within 90 days of grant end date.
- Attendance at the CCF Gala on November 4, 2023 at Martins Crosswinds in Greenbelt, MD to receive Award.
- Participation in the 8th Annual CCF Research Symposium with a presentation or poster. The tentative date is Wednesday, June 12, 2024.
- Award (check) is to be deposited in a timely manner so that funds clear prior to December 31, 2023.
- Citation of CCF support in ALL relevant published material and notification to CCF of publications. Failure of citation may impact future funding eligibility.

**2023 CCF Research Grant Proposal Specifications**

1. Cover Sheet
2. If Re-submission or Renewal  
   Please include a one (1) page Introduction. Applicants who have received a previous CCF grant may apply for continued funding, but must include the results of their current research, discuss the progress made in prior year(s), and state how continued funding will advance research in this area.
3. Narrative (no more than 6 pages)  
   a. Introduction (if new request and not resubmission or renewal)  
   b. Specific Aims  
   c. Background and Significance  
   d. Preliminary Data  
   e. Experimental Design/Methods
4. References Cited (not included in 6-page limit; no limit on number of references or page length)
5. CCF-specific References  
   In addition to the listing of references, please include all previous CCF grants received, amount, year awarded, and links to or attachments of all resulting publications from CCF-funded research.
6. Budget (up to $75,000 for one year)  
   Direct costs may include salary, research supplies and equipment. Equipment costs must be less than $5,000 and not be administrative in nature. Grant funding MAY NOT be used for indirect costs such as travel associated with the research, administrative supplies, advertising/PR, student or university memberships and parking or other facility-related fees.
7. Lay Summary (1–2 pages recommended)
8. NIH Biosketch  
   Please include NIH Biosketch of Applicant and any other key personnel involved in this Project. The current NIH biosketch format is preferred (OMB No. 0925-0001 and 0925-0002, Rev.10/2021 Approved Through 09/30/2024).
`.trim();

const defaultNextGenContent = `
**2023 CCF Giant Food NextGen Award**

The Next Generation, or "NextGen" Grant has been created specifically for Young Investigators at the end of their fellowship training or early in their research career, working in a hospital or research facility in the Maryland/DC/Northern Virginia area. Applicants must demonstrate commitment to pursuing a long-term career in Pediatric Oncology research and must have support from a clearly identified Mentor in the proposed research field from the Sponsoring Institution. The application must document the Mentor’s support of, and involvement in, the Research Project. The NextGen Award is generously funded by Giant Food.

A “Young Investigator” for the purpose of this Grant is defined as an individual who:

- Holds the degree of M.D., Ph.D., D.O., or any combination thereof
- Has completed a Pediatric Oncology Research Fellowship or equivalent training
- Is no more than 6 years post highest doctoral degree; and no more than 3 years post completion of Research Fellowship
- Does not hold an appointment higher than Assistant Professor

**Citizenship**

At the time of application, candidates must be United States citizens or foreign nationals holding either a permanent resident (I-551 or Green Card) or a USCIS-issued I-551 temporary evidence stamp in one’s passport, or foreign nationals with J1 or H1B visas that extend beyond the life of the grant. All foreign nationals must submit, with the application, notarized evidence of this status. At the time of application and throughout the award, an applicant must be employed by a U.S. institution.

**Selection Process and Award Details**

NextGen Grant Proposals are reviewed by an independent Selection Committee. All submitted grants will receive a score and overall critique. Notification of Grant Award will be made by August 2023 and formal agreements will follow. Award checks will be presented to recipients at the CCF Gala on November 4, 2023.

The Selection Committee reserves the right to determine the applicant’s eligibility based on the information and justifications included in the application materials.

Applicants must specify that a minimum of 50% of the Applicant’s time is allocated to the CCF-funded research. Applicants MAY be involved in other research grants, but there must be clear documentation of mechanisms to avoid scientific and/or budgetary overlap.

There will be one (1) NextGen Grant awarded for 2023 with a maximum award amount of $100,000. The Grant will be awarded for a period of one (1) year only.

The Giant Food NextGen Awardee is not eligible to apply for this grant for a second year. The Awardee will, however, be encouraged to apply for CCF funding for a one-year grant in subsequent year(s).

**2023 CCF Grant Submission Process**

Please ensure that the following elements are included with the proposal:

- Cover Sheet (attached to this letter)
- Investigator Profile, including the reason for pursuing a career in Pediatric Oncology Research
- Mentor Letter of Support, including the Mentor’s qualifications and involvement in the Applicant’s Project and institutional support of independent research
- All pertinent pending grants, particularly those with overlapping scientific aims

**Requirements**

The obligations of grant awardees after notification are:

- Submission of a two (2) page progress report within 90 days of grant end date
- Attendance at the CCF Gala on November 4, 2023 at Martins Crosswinds in Greenbelt, MD to receive Award
- Participation in the 8th Annual CCF Research Symposium with a presentation or poster (tentative date Wednesday, June 12, 2024)
- Award (check) is to be deposited in a timely manner so that funds clear prior to December 31, 2023
- Citation of CCF support in ALL relevant published material and notification to CCF of publications. Failure of citation may impact future funding eligibility.

**2023 CCF Giant Food NextGen Grant Proposal Specifications**

1. Cover Sheet (attached to this letter)
2. Narrative (No more than SIX (6) pages)  
   a. Introduction  
   b. Specific Aims  
   c. Background and Significance  
   d. Preliminary Data  
   e. Experimental Design/Methods
3. References Cited (not included in 6-page limit; no limit on number of references)
4. Budget (up to $100,000 for ONE year)  
   Direct costs may include salary, research supplies and equipment. Equipment costs must be less than $5,000 and not be administrative in nature. Grant funding MAY NOT be used for indirect costs such as travel associated with the research, administrative supplies, advertising/PR, student or university memberships and parking or other facility-related fees.
5. Lay Summary (~1/2 page recommended)
6. Applicant's Statement of Long-term Career Goals (~1 page)  
   Applicant should include reasons for commitment to pediatric oncology research, plans for career development and mentoring activities, and long-term career goals.
7. Mentor’s Letter of Commitment  
   A letter signed by the identified primary mentor referencing involvement and time commitment to the Research Project, acknowledgment that they have reviewed and approved the Grant Application, and mentoring strategies to be used.
8. Support Letter from Sponsoring Institution (Hospital or University Department Chair, Division Director, or Dean, or equivalent)  
   Including institutional support, any matching/other funding, and level of independence.
9. NIH Biosketch  
   Please include NIH Biosketch of Applicant, Mentor, and any other key personnel involved in this Project.
`.trim();

const defaultNonResearchContent = `
**2023 CCF Non-Research Award**

In addition to its annual research grants, The Children’s Cancer Foundation (CCF) has regularly funded a variety of non-research requests. CCF welcomes innovative and meaningful proposals for Non-Research Grants that align with CCF’s mission:

CCF is committed to funding locally-based researchers, programs and facilities until every child is assured a healthy cancer-free future.

**Proposal Guidelines**

The proposal should NOT exceed 3 (three) typed pages and should include:

- The amount requested
- An explanation of the Project requested
- Justification for the need for your requested Project
- Time frame (when Project will be started/completed)
- Budget for Project
- Signature of Department Head or other person(s) designated to approve grant requests

We ask that you include other sources from which you are seeking to fund the Project and any other funding source, and/or the amount contributed by your Institution/Hospital.

**Requirements**

- The facility or program is based or conducted in the MD/D.C./N. Va region
- The project/program/service is related to pediatric oncology
- A final report that includes the budget, 2–3 photos, and an evaluation to be submitted within three months of the grant end date
- Announcement of CCF funding through awardee’s social media platforms, and recognition of CCF support in any event signage/publicity materials
`.trim();

export const getDefaultAboutPage = (id: ApplicationAboutType): AboutPage => {
    switch (id) {
        case "Research":
            return { id: "Research", title: "About the CCF Research Award", content: defaultResearchContent };
        case "NextGen":
            return { id: "NextGen", title: "2023 CCF Giant Food NextGen Award", content: defaultNextGenContent };
        case "NonResearch":
        default:
            return { id: "NonResearch", title: "2023 CCF Non-Research Award", content: defaultNonResearchContent };
    }
};

export const getDefaultAboutPages = (): AboutPage[] => ([
    getDefaultAboutPage("Research"),
    getDefaultAboutPage("NextGen"),
    getDefaultAboutPage("NonResearch"),
]);

export const getAboutPages = async (): Promise<AboutPage[]> => {
    try {
        const defaults = getDefaultAboutPages();
        const byId: Record<ApplicationAboutType, AboutPage> = {
            Research: defaults[0],
            NextGen: defaults[1],
            NonResearch: defaults[2],
        };

        const q = query(collection(db, COLLECTION_NAME));
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
            const data = d.data() as any;
            const id = d.id as ApplicationAboutType;
            if (byId[id]) {
                byId[id] = {
                    id,
                    title: data.title || byId[id].title,
                    content: (data.content ?? "").toString() || byId[id].content,
                };
            }
        });

        return [byId.Research, byId.NextGen, byId.NonResearch];
    } catch (error) {
        console.error("Error in getAboutPages:", error);
        // If anything goes wrong, fall back to defaults so the app still works
        return getDefaultAboutPages();
    }
};

export const upsertAboutPage = async (page: AboutPage): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, page.id);
    await setDoc(docRef, {
        title: page.title ?? "",
        content: page.content,
    });
};

