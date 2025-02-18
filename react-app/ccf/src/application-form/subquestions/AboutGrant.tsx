import React from "react";
import "./SubForm.css";

type AboutGrantProps = {
    type: "Research" | "NextGen" | "NonResearch";
    formData: {
      projectTitle: string;
      investigator?: string;
      cancers?: string;
      institution: string;
      institutionAddress?: string;
      institutionPhone: string;
      institutionEmail: string;
      adminName?: string;
      adminAddress?: string;
      adminPhone?: string;
      adminEmail?: string;
      published?: string;
      paperWIP?: string;
      appliedPatent?: string;
      includedInfo?: string;
      amountRequested: string;
      grantProjDates?: string;
      contCurrentFunds?: string;
      file: File | null;
      requester?: string;
      explanation?: string;
      sources?: string;
      timeframe?: string;
      additionalInfo?: string;
    };
  };

function AboutGrant({ type, formData }: AboutGrantProps): JSX.Element {
  if (type === "Research")
    return (
      <div className="review-form-container">
        <div className="proposal-text">
          <p className="text-label">
            <b>About the CCF Research Award</b>
          </p>

          <p className="text-label">
            CCF welcomes meritorious laboratory and clinical research proposals
            relevant to pediatric cancer research. Grants will be awarded for a
            period of one year, beginning November 2023. The budget amount for
            Research grants is $75,000.
          </p>

          <p className="text-label">
            CCF provides grants in support of pediatric cancer research in the
            Maryland/DC/Northern Virginia area.
          </p>

          <p className="text-label">
            <b>Citizenship</b>
          </p>

          <p className="text-label">
            At the time of application, candidates must be U.S. citizens,
            foreign nationals holding either a permanent resident (I-551 or
            Green Card) or a USCIS-issued I-551 temporary evidence stamp in
            one’s passport, or foreign nationals with J1 or H1B visas that
            extend beyond the life of the grant. All foreign nationals must
            submit, with the application, notarized evidence of this status. At
            the time of application and throughout the award, an applicant must
            be employed by a U.S. institution.
          </p>

          <p className="text-label">
            <b>Selection Process and Award Details</b>
          </p>

          <p className="text-label">
            Grant Proposals are reviewed by an independent Selection Committee.
            All submitted grants will receive a score and overall critique.
            Notification of Grant Award will be made by August 2023, and formal
            agreements will follow. Award checks will be presented to recipients
            at the CCF Gala on November 4, 2023.
          </p>

          <p className="text-label">
            The Selection Committee reserves the right to determine applicant’s
            eligibility based on the information and justifications included in
            the application materials.
          </p>

          <p className="text-label">
            Applicants MAY be involved in other research grants, but there must
            be clear documentation of mechanisms to avoid scientific and/or
            budgetary overlap.
          </p>

          <p className="text-label">
            There will be multiple Research Grants awarded for 2023 with a
            maximum award amount of $75,000. The Grant will be awarded for a
            period of one (1) year only, but the Research Award Winner will be
            encouraged to apply for CCF funding in subsequent year(s).
          </p>

          <p className="text-label">
            <b>2023 CCF Grant Submission Process</b>
          </p>

          <p className="text-label">
            Please ensure that the following elements are included with the
            proposal:
          </p>
          <p className="text-label">
            • Cover Sheet (enclosed), completely filled out, including
            Department Chair signature,
          </p>
          <p className="text-label">• All appropriate Biosketches, and</p>
          <p className="text-label">
            • Current and pending Grant disclosure, particularly those with
            overlapping scientific aims.
          </p>

          <p className="text-label">
            <b>Requirements</b>
          </p>

          <p className="text-label">
            The obligations of grant awardees after notification are:
          </p>
          <p className="text-label">
            • Submission of a two (2) page report within 90 days of grant end
            date.
          </p>
          <p className="text-label">
            • Attendance at the CCF Gala on November 4, 2023 at Martins
            Crosswinds in Greenbelt, MD to receive Award.
          </p>
          <p className="text-label">
            • Participation in the 8th Annual CCF Research Symposium with a
            presentation or poster. The tentative date is Wednesday, June 12,
            2024.
          </p>
          <p className="text-label">
            • Award (check) is to be deposited in a timely manner so that funds
            clear prior to December 31, 2023.
          </p>
          <p className="text-label">
            • Citation of CCF support in ALL relevant published material and
            notification to CCF of publications. Failure of citation may impact
            future funding eligibility.
          </p>

          <br />
          <p className="text-label">
            <b>2023 CCF Research Grant Proposal Specifications</b>
          </p>

          <p className="text-label">
            <b>1. Cover Sheet</b>
          </p>

          <p className="text-label">
            <b>2. If Re-submission or Renewal</b>
          </p>

          <p className="text-label">
            Please include a one (1) page Introduction. Applicants who have
            received a previous CCF grant may apply for continued funding, but
            must include the results of their current research, discuss the
            progress made in prior year(s), and state how continued funding will
            advance research in this area.
          </p>

          <p className="text-label">
            <b>3. Narrative </b>(no more than 6 pages)
          </p>

          <p className="text-label">
            a. Introduction (if new request and not resubmission or renewal –
            see above)
          </p>
          <p className="text-label">b. Specific Aims</p>
          <p className="text-label">c. Background and Significance</p>
          <p className="text-label">d. Preliminary Data</p>
          <p className="text-label">e. Experimental Design/Methods</p>

          <p className="text-label">
            <b>4. References Cited </b>(not included in 6-page limit; no limit
            on number of references or page length)
          </p>

          <p className="text-label">
            <b>5. CCF-specific References</b>
          </p>

          <p className="text-label">
            In addition to the listing of references, please include all
            previous CCF grants received, amount, year awarded, and links to or
            attachments of all resulting publications from CCF-funded research.
          </p>

          <p className="text-label">
            <b>6. Budget </b>(up to $75,000 for one year)
          </p>

          <p className="text-label">
            Direct costs may include salary, research supplies and equipment.
            Equipment costs must be less than $5,000 and not be administrative
            in nature. Grant funding MAY NOT be used for indirect costs such as
            travel associated with the research, administrative supplies,
            advertising/PR, student or university memberships and parking or
            other facility-related fees.
          </p>

          <p className="text-label">
            <b>7. Lay Summary </b>(1-2 pages recommended)
          </p>

          <p className="text-label">
            Please include NIH Biosketch of Applicant and any other key
            personnel involved in this Project. The current NIH biosketch format
            is preferred: OMB No. 0925-0001 and 0925-0002 (Rev.10/2021 Approved
            Through 09/30/2024), and instructions can be found here:
            https://grants.nih.gov/grants/forms/biosketch.htm
          </p>

          <p className="text-label">
            <b>8. NIH Biosketch</b>
          </p>

          <p className="text-label">
            Please include NIH Biosketch of Applicant and any other key
            personnel involved in this Project. The current NIH biosketch format
            is preferred: OMB No. 0925-0001 and 0925-0002 (Rev.10/2021 Approved
            Through 09/30/2024), and instructions can be found here:
            https://grants.nih.gov/grants/forms/biosketch.htm
          </p>
        </div>
      </div>
    );
  else if (type === "NextGen")
    return (
      <div className="form-container">
        <div className="proposal-text">
          <p className="text-label">
            <b>2023 CCF Giant Food NextGen Award</b>
          </p>

          <p className="text-label">
            The Next Generation, or "NextGen" Grant has been created
            specifically for Young Investigators at the end of their fellowship
            training or early in their research career, working in a hospital or
            research facility in the Maryland/DC/Northern Virginia area.
            Applicants must demonstrate commitment to pursuing a long-term
            career in Pediatric Oncology research and must have support from a
            clearly identified Mentor in the proposed research field from the
            Sponsoring Institution. The application must document the Mentor’s
            support of, and involvement in, the Research Project. The NextGen
            Award is generously funded by Giant Food. A “Young Investigator” for
            the purpose of this Grant is defined as an individual who:
          </p>

          <p className="text-label">
            • holds the degree of M.D., Ph.D., D.O., or any combination thereof;
          </p>
          <p className="text-label">
            • has completed a Pediatric Oncology Research Fellowship or
            equivalent training;
          </p>
          <p className="text-label">
            • is no more than 6 years post highest doctoral degree; and no more
            than 3 years post completion of Research Fellowship;
          </p>
          <p className="text-label">
            • does not hold an appointment higher than Assistant Professor.
          </p>

          <p className="text-label">
            <b>Citizenship</b>
          </p>

          <p className="text-label">
            At the time of application, candidates must be United States
            citizens or foreign nationals holding either a permanent resident
            (I-551 or Green Card) or a USCIS-issued I-551 temporary evidence
            stamp in one’s passport, or foreign nationals with J1 or H1B visas
            that extend beyond the life of the grant. All foreign nationals must
            submit, with the application, notarized evidence of this status. At
            the time of application and throughout the award, an applicant must
            be employed by a U.S. institution.
          </p>

          <p className="text-label">
            <b>Selection Process and Award Details</b>
          </p>

          <p className="text-label">
            NextGen Grant Proposals are reviewed by an independent Selection
            Committee. All submitted grants will receive a score and overall
            critique. Notification of Grant Award will be made by August 2023
            and formal agreements will follow. Award checks will be presented to
            recipients at the CCF Gala on November 4, 2023.
          </p>

          <p className="text-label">
            The Selection Committee reserves the right to determine the
            applicant’s eligibility based on the information and justifications
            included in the application materials.
          </p>

          <p className="text-label">
            Applicants must specify that a minimum of 50% of the Applicant’s
            time is allocated to the CCF-funded research. Applicants MAY be
            involved in other research grants, but there must be clear
            documentation of mechanisms to avoid scientific and/or budgetary
            overlap.
          </p>

          <p className="text-label">
            There will be one (1) NextGen Grant awarded for 2023 with a maximum
            award amount of $100,000. The Grant will be awarded for a period of
            one (1) year only.
          </p>

          <p className="text-label">
            The Giant Food NextGen Awardee is not eligible to apply for this
            grant for a second year. The Awardee will, however, be encouraged to
            apply for CCF funding for a one-year grant in subsequent year(s).
          </p>

          <p className="text-label">
            <b>2023 CCF Grant Submission Process</b>
          </p>

          <p className="text-label">
            Please ensure that the following elements are included with the
            proposal:
          </p>
          <p className="text-label">• Cover Sheet (attached to this letter)</p>
          <p className="text-label">
            • Investigator Profile, including the reason for pursuing a career
            in Pediatric Oncology Research.
          </p>
          <p className="text-label">
            • Mentor Letter of Support, including the Mentor’s qualifications
            and involvement in the Applicant’s Project and institutional support
            of independent research, and
          </p>
          <p className="text-label">
            • All pertinent pending grants, particularly those with overlapping
            scientific aims, are disclosed.
          </p>
          <p className="text-label">
            • Your Investigator Profile, including the reason for pursuing a
            career in Pediatric Oncology Research.
          </p>
          <p className="text-label">
            • Letter of support from the Applicant’s Mentor, and
          </p>
          <p className="text-label">
            • Mentor’s support in mentoring the Investigator while the Research
            Project is being conducted. An explicit level of institutional
            support showing independence includes start-up package information
            about lab space, salary, and supplies, if appropriate.
          </p>

          <p className="text-label">
            <b>Requirements</b>
          </p>

          <p className="text-label">
            The obligations of grant awardees after notification are:
          </p>
          <p className="text-label">
            • Submission of a two (2) page progress report within 90 days of
            grant end date.
          </p>
          <p className="text-label">
            • Attendance at the CCF Gala on November 4, 2023 at Martins
            Crosswinds in Greenbelt, MD to receive Award.
          </p>
          <p className="text-label">
            • Participation in the 8th Annual CCF Research Symposium with a
            presentation or poster. The tentative date is Wednesday, June 12,
            2024.
          </p>
          <p className="text-label">
            • Award (check) is to be deposited in a timely manner so that funds
            clear prior to December 31, 2023.
          </p>
          <p className="text-label">
            • Citation of CCF support in ALL relevant published material and
            notification to CCF of publications. Failure of citation may impact
            future funding eligibility.
          </p>

          <p className="text-label">
            <b>2023 CCF Giant Food NextGen Grant Proposal Specifications</b>
          </p>

          <p className="text-label">
            <b>1. Cover Sheet </b>(attached to this letter)
          </p>

          <p className="text-label">
            <b>2. Narrative </b>(No more than SIX (6) pages)
          </p>

          <p className="text-label">a. Introduction</p>
          <p className="text-label">b. Specific Aims</p>
          <p className="text-label">c. Background and Significance</p>
          <p className="text-label">d. Preliminary Data</p>
          <p className="text-label">e. Experimental Design/Methods</p>

          <p className="text-label">
            <b>3. References Cited </b>(not included in 6-page limit; no limit
            on number of references)
          </p>

          <p className="text-label">
            <b>4. Budget</b>(up to $100,000 for ONE year)
          </p>

          <p className="text-label">
            Direct costs may include salary, research supplies and equipment.
            Equipment costs must be less than $5,000 and not be administrative
            in nature. Grant funding MAY NOT be used for indirect costs such as
            travel associated with the research, administrative supplies,
            advertising/PR, student or university memberships and parking or
            other facility-related fees.
          </p>

          <p className="text-label">
            <b>5. Lay Summary</b> (~1/2 page recommended)
          </p>

          <p className="text-label">
            <b>6. Applicant's Statement of Long-term Career Goals </b>(~1 page)
          </p>

          <p className="text-label">
            Applicant should include reasons for commitment to pediatric
            oncology research, plans for career development and mentoring
            activities, and long-term career goals.{" "}
          </p>

          <p className="text-label">
            <b>7. Mentor’s Letter of Commitment</b>
          </p>

          <p className="text-label">
            A letter signed by the identified primary mentor should be included;
            and should reference his/her involvement and time commitment to the
            Research Project, acknowledgment that he/she has reviewed and
            approved the Grant Application, and mentoring strategies to be used
            when working with the Young Investigator. It must also be clearly
            stated that the applicant will be primarily responsible for
            execution of the research project.{" "}
          </p>

          <p className="text-label">
            <b>8. Support Letter from Sponsoring Institution </b>(Hospital or
            University Department Chair, Division Director, or Dean, or
            equivalent)
          </p>

          <p className="text-label">
            • Acknowledges that adequate space will be provided as well as
            access to the available resources of the hospital/university or
            research institution
          </p>
          <p className="text-label">
            • If the sponsoring institution will be providing matching or other
            funding, include the type and amount of that support.
          </p>
          <p className="text-label">
            • Indicate explicit level of institutional support showing
            independence, including start-up package information: lab space,
            salary, and supplies, if appropriate
          </p>
          <p className="text-label">
            • A signature from an institutional representative on the cover page
            of the Grant Application accepts the provision that the award will
            not cover any indirect costs.
          </p>
          <p className="text-label">
            • Citation of CCF support in ALL relevant published material and
            notification to CCF of publications. Failure of citation may impact
            future funding eligibility.
          </p>

          <p className="text-label">
            <b>9. NIH Biosketch</b>
          </p>

          <p className="text-label">
            Please include NIH Biosketch of Applicant, Mentor, and any other key
            personnel involved in this Project. The current NIH biosketch format
            is preferred: [OMB No. 0925-0001 and 0925-0002 (Rev. 10/2021
            Approved Through 09/30/2024)], and instructions can be found here:
            https://grants.nih.gov/grants/forms/biosketch.htm.{" "}
          </p>
        </div>
      </div>
    );
  else
    return (
      <div className="form-container">
        <div className="proposal-text">
          <p className="text-label">
            <b>2023 CCF Non-Research Award</b>
          </p>

          <p className="text-label">
            In addition to its annual research grants, The Children’s Cancer
            Foundation (CCF) has regularly funded a variety of non-research
            requests. CCF welcomes innovative and meaningful proposals for
            Non-Research Grants that align with CCF’s mission:
          </p>
           
          <p className="text-label">
            CCF is committed to funding locally-based researchers, programs and
            facilities until every child is assured a healthy cancer-free
            future.
          </p>
          <br />
          <p className="text-label">
            <b>
              The proposal should NOT exceed 3 (three) typed pages and should
              include:
            </b>
          </p>

          <p className="text-label">• The amount requested,</p>
          <p className="text-label">
            • An explanation of the Project requested,
          </p>
          <p className="text-label">
            • Justification for the need for your requested Project,
          </p>
          <p className="text-label">
            • Time frame (when Project will be started/completed),
          </p>
          <p className="text-label">• Budget for Project, and</p>
          <p className="text-label">
            • Signature of Department Head or other person(s) designated to
            approve grant requests.
          </p>
            <br />
          <p className="text-label">
            We ask that you include other sources from which you are seeking to
            fund the Project and any other funding source, and/or the amount
            contributed by your Institution/Hospital.
          </p>

          <p className="text-label">
            <b>Requirements</b>
          </p>

          <p className="text-label">
            • The facility or program is based or conducted in the MD/D.C./N. Va
            region
          </p>
          <p className="text-label">
            • The project/program/service is related to pediatric oncology
          </p>
          <p className="text-label">
            • A final report that includes the budget, 2-3 photos, and an
            evaluation to be submitted within three months of the grant end
            date.
          </p>
          <p className="text-label">
            • Announcement of CCF funding through awardee’s social media
            platforms, and recognition of CCF support in any event
            signage/publicity materials.
          </p>
        </div>
      </div>
    );
}

export default AboutGrant;
