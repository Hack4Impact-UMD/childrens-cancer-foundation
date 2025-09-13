# Complete Guide to Dynamic Forms Migration & Versioning

This document provides a comprehensive guide for migrating from the legacy static application forms to the new dynamic form system. It also details how to manage form versions and update dependent components.

## 1. How the Dynamic Form System Works

The dynamic form system is built on three core concepts: **Form Templates**, a **Form Renderer**, and **Application Submissions**.

### 1.1. Form Templates (`form-template-service.ts`)

-   **What they are:** Form Templates are JSON objects stored in the `formTemplates` collection in Firestore. They define the entire structure of a form, including its name, grant type, pages, and an array of fields for each page.
-   **Structure:** Each field is an object that specifies its `id`, `type` (e.g., `text`, `number`, `file`), `label`, `required` status, and `validation` rules.
-   **Management:** The `form-template-service.ts` handles all CRUD (Create, Read, Update, Delete) operations for these templates. It also manages which template is `isActive` for a given grant type.

### 1.2. Form Renderer (`DynamicForm.tsx`)

-   **What it is:** This is a React component that takes a Form Template object as a prop.
-   **Functionality:** It dynamically renders the form UI based on the template's structure. It iterates through the pages and fields defined in the template and creates the appropriate input elements, labels, and validation logic on the fly.

### 1.3. Application Submissions (`dynamic-application-service.ts`)

-   **What they are:** When a user fills out a dynamic form, their data is saved as a document in the `applications` collection in Firestore.
-   **Structure:** Each submission document contains:
    -   `formTemplateId` and `formVersion`: Pointers to the exact template version used for the submission.
    -   `formData`: A JSON object where keys are the field `id`s from the template and values are the user's input.
    -   `isLegacy: false`: A flag to distinguish it from old, static form submissions.
    -   **Compatibility Fields:** To ensure backward compatibility, key information (e.g., `title`, `institution`, `amountRequested`, `principalInvestigator`) is extracted from `formData` and stored as top-level fields on the application document itself.

---

## 2. Updating Components for Dynamic Form Data

As we transition to dynamic forms, any component that reads data from the `applications` collection must be updated to handle both new dynamic submissions and legacy static submissions gracefully.

The key principle is to **always check for the data in `formData` first** before falling back to the top-level (legacy) fields.

### 2.1. Migrating the Grant Awards Page

-   **File:** `react-app/ccf/src/pages/grant-awards/GrantAwards.tsx`
-   **Context:** The `fetchApplications` function in this component is responsible for fetching all application data and mapping it into the `GrantAwardApplication` type for display in the awards table.

#### **Migration Steps**

Modify the data mapping within the `for (const doc of querySnapshot.docs)` loop to prioritize data from the `formData` object.

**Assume your dynamic form template uses these IDs:**
- `project_title` for the application title.
- `principal_investigator` for the applicant's name.
- `institution_name` for the institution.
- `amount_requested` for the requested funding amount.

**BEFORE:**
```typescript
// Map Firestore data to GrantAwardApplication interface (without admin data)
const application: GrantAwardApplication = {
    id: doc.id,
    name: data.principalInvestigator || "Unknown",
    programType: data.grantType || "Unknown",
    institution: data.institution || "Unknown Institution",
    title: data.title || "",
    // ... other fields
};
```

**AFTER:**
```typescript
// data has type 'any' from doc.data()
const data: any = doc.data();

// Map Firestore data to GrantAwardApplication interface (without admin data)
const application: GrantAwardApplication = {
    id: doc.id,
    // Prioritize formData, then fall back to legacy/compatibility fields
    name: data.formData?.principal_investigator || data.principalInvestigator || "Unknown",
    programType: data.grantType || "Unknown",
    institution: data.formData?.institution_name || data.institution || "Unknown Institution",
    title: data.formData?.project_title || data.title || "",
    // ... map other fields similarly
};
```

### 2.2. Migrating the Admin Post-Grant Reports Page

-   **File:** `react-app/ccf/src/pages/admin-post-grant-reports/AdminPostGrantReports.tsx`
-   **Context:** The `fetchAllApplicationsWithReports` function fetches application data to correlate it with submitted post-grant reports. It needs to display application details like the title, PI, and institution.

#### **Migration Steps**

Modify the data processing loop to ensure it correctly reads from both dynamic and legacy application structures.

**Assume your dynamic form template uses these IDs:**
- `project_title` for the application title.
- `principal_investigator` for the applicant's name.
- `institution_name` for the institution.

**BEFORE:**
```typescript
// Inside the 'for (const doc of applicationsSnapshot.docs)' loop
const applicationData = doc.data() as ApplicationInfo;

applicationsWithReportStatus.push({
    ...applicationData,
    // ... other fields
});
```

**AFTER:**
```typescript
// Inside the 'for (const doc of applicationsSnapshot.docs)' loop
const applicationData = doc.data() as any; // Treat as 'any' to access both structures

// ... logic to check if application is accepted

if (isAccepted) {
    // ... logic to find report data

    // Create a new object with correctly mapped data
    const mappedApplication = {
        applicationId: parseInt(doc.id) || applicationData.applicationId,
        // Prioritize formData, then fall back to legacy/compatibility fields
        title: applicationData.formData?.project_title || applicationData.title,
        principalInvestigator: applicationData.formData?.principal_investigator || applicationData.principalInvestigator,
        institution: applicationData.formData?.institution_name || applicationData.institution,
        grantType: applicationData.grantType,
        // ... other fields
    };

    applicationsWithReportStatus.push({
        ...mappedApplication,
        // ... report status fields
    });
}
```

### 2.3. Migrating the Applicant Dashboard

-   **File:** `react-app/ccf/src/pages/applicant-dashboard/ApplicantDashboard.tsx`
-   **Context:** This dashboard displays a list of the user's completed applications, showing the grant type and decision status. This information must be read correctly from both legacy and dynamic application objects.

#### **Migration Steps**

The component already correctly uses a type `ApplicationWithDecision` which is a union of `Application | DynamicApplication`. However, the JSX that renders the information accesses the fields directly. This needs to be updated to handle both cases.

**BEFORE:**
```typescript
// Inside the .map loop for completedApplications
<div key={index} className="ApplicantDashboard-single-application-box">
    <div className="application-info" >
        <FaFileAlt className="application-icon" />
        <p>{firstLetterCap(application.grantType)}</p>
    </div>
    <div className="ApplicantDashboard-application-status" onClick={() => { setOpenModal(application) }}>
        <p>{firstLetterCap(application.decision)}</p>
        <FaArrowRight className="application-status-icon" />
    </div>
    <CoverPageModal application={application} isOpen={openModal == application} onClose={closeModal}></CoverPageModal>
</div>
```

**AFTER:**

No change is strictly necessary here **if** the top-level `grantType` and `decision` fields are reliably populated on all `DynamicApplication` documents as compatibility fields. The `dynamic-application-service` is designed to do this.

However, for maximum robustness and to guard against future changes, it is best practice to use a helper function or inline checks.

**Recommended Robust Implementation:**

1.  Add a helper function inside your component to get the grant type, or do it inline.
2.  The `decision` field is a top-level field for both types, so it can be accessed directly.

```typescript
// Recommended change inside the .map loop
<div key={index} className="ApplicantDashboard-single-application-box">
    <div className="application-info" >
        <FaFileAlt className="application-icon" />
        {/* The grantType is a top-level field on both types, so direct access is okay */}
        <p>{firstLetterCap((application as any).grantType)}</p>
    </div>
    <div className="ApplicantDashboard-application-status" onClick={() => { setOpenModal(application) }}>
        {/* The decision is a top-level field on both types, so direct access is okay */}
        <p>{firstLetterCap((application as any).decision)}</p>
        <FaArrowRight className="application-status-icon" />
    </div>
    <CoverPageModal application={application} isOpen={openModal == application} onClose={closeModal}></CoverPageModal>
</div>
```
In this specific case, because `grantType` and `decision` are consistently available as top-level compatibility fields, no code change is mandatory for this component to function. This section is included to confirm the component was reviewed and to explain *why* it works as is.

---

## 3. Form Versioning Strategy

The system is designed to handle changes to forms over time without corrupting old data.

-   **Creating a New Version:** **NEVER** modify a published `FormTemplate` that already has submissions. Instead, create a **new version**.
    1.  Use the `duplicateFormTemplate` function or manually create a new template document in Firestore.
    2.  In the new template, increment the `version` number (e.g., from `1` to `2`).
    3.  Make your desired changes (add, remove, or modify fields).
    4.  Activate the new version using `activateFormTemplate(newTemplateId)`.
-   **How it Works:**
    -   New applications will now use the new template version.
    -   Existing applications remain linked to the old `formTemplateId` and `formVersion`, ensuring that when you view an old application, it can still be rendered correctly with its original structure.
    -   Your data access logic (from Section 2 above) must be robust enough to handle fields that may exist in one version but not another. The `formData?.fieldName` optional chaining syntax is essential here.

By following this guide, you can fully transition to the more flexible and maintainable dynamic forms system while ensuring data integrity and backward compatibility.
