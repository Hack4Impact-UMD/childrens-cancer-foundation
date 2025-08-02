# Children's Cancer Foundation - Grant Application Portal

## Project Overview

This project is a web application for the Children's Cancer Foundation (CCF) to manage their grant application process. It provides a portal for applicants to submit their grant proposals, for reviewers to evaluate the applications, and for administrators to manage the entire process, including user accounts, application cycles, and grant awards.

## Tech Stack

The project is built using the following technologies:

- **Frontend:**
  - **React:** A JavaScript library for building user interfaces.
  - **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
  - **React Router:** For declarative routing in the React application.
  - **Material-UI (MUI):** A popular React UI framework for faster and easier web development.
  - **Firebase:** Used for backend services including authentication, database, and storage.

## Project Structure

The project follows a standard Create React App structure, with the main application code located in the `src` directory.

```
/
├── build/                  # Production build output
├── functions/              # Firebase Cloud Functions
├── public/                 # Public assets
│   ├── index.html          # Main HTML file
│   └── ...
├── src/
│   ├── assets/             # Images and other static assets
│   ├── backend/            # Backend logic (Firebase interactions and cloud function calls)
│   ├── components/         # Reusable React components
│   ├── firebase_config/    # Firebase configuration
│   ├── pages/              # Top-level page components
│   ├── services/           # Services for interacting with backend
│   ├── types/              # TypeScript type definitions
│   └── ...
├── .gitignore              # Git ignore file
├── package.json            # Project dependencies and scripts
├── README.md               # Project documentation
└── tsconfig.json           # TypeScript configuration
```

### Key Directories

- **`functions/`**: Contains Firebase Cloud Functions for secure server-side processing.
- **`src/assets`**: Contains static assets like images and icons.
- **`src/backend`**: Contains the logic for interacting with Firebase services and calling secure cloud functions. This includes functions for submitting forms, managing application cycles, filtering applications, and handling user roles.
- **`src/components`**: Contains reusable React components that are used across different pages. This includes components for banners, buttons, modals, and the sidebar.
- **`src/firebase_config`**: Contains the Firebase configuration file (`FireConfig.ts`).
- **`src/pages`**: Contains the main page components, each corresponding to a specific route in the application. This includes pages for login, dashboards for different user roles, application forms, and settings.
- **`src/services`**: Contains services that abstract the backend logic and provide a clean API for the components to use.
- **`src/types`**: Contains TypeScript type definitions for the data structures used in the application.

## Getting Started

To get the project up and running on your local machine, follow these steps:

### Prerequisites

- **Node.js and npm:** Make sure you have Node.js and npm installed. You can download them from [nodejs.org](https://nodejs.org/).
- **Firebase CLI:** Install Firebase CLI globally: `npm install -g firebase-tools`

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd react-app/ccf
    ```
3.  **Install the dependencies:**
    ```bash
    npm install
    ```
4.  **Install Firebase Functions dependencies:**
    ```bash
    cd ../../functions
    npm install
    ```

### Running the Application

To run the application in development mode, use the following command:

```bash
npm start
```

This will start the development server and open the application in your default browser at `http://localhost:3000`. The page will automatically reload if you make any changes to the code.

For local development with Firebase emulators, run `firebase emulators:start` from the project root.

## Firebase Integration

The project uses Firebase for various backend services, including Authentication, Firestore Database, and Storage.

### Firebase Configuration

The Firebase configuration is located in `src/firebase_config/FireConfig.ts`. This file contains the API keys and other configuration details for connecting to the Firebase project.

**Security Note:** The Firebase API keys are currently exposed in the source code. For a production environment, it is crucial to restrict the API keys to specific domains and use Firebase security rules to protect your data.

### Firebase Authentication

Firebase Authentication is used to manage user accounts. It supports email and password authentication for applicants, reviewers, and administrators.

### Firestore Database

The project uses Firestore as its primary database. The data is organized into several collections:

- **`applicants`**: Stores information about the applicants.
  - **Document ID:** User ID (UID) from Firebase Authentication.
  - **Data:**
    - `firstName` (string)
    - `lastName` (string)
    - `title` (string)
    - `email` (string)
    - `affiliation` (string)

- **`reviewers`**: Stores information about the reviewers.
  - **Document ID:** User ID (UID) from Firebase Authentication.
  - **Data:**
    - `firstName` (string)
    - `lastName` (string)
    - `title` (string)
    - `email` (string)
    - `affiliation` (string)
    - `assignedApplications` (array of strings): A list of application IDs that have been assigned to the reviewer.

- **`applications`**: Stores the grant applications submitted by applicants.
  - **Document ID:** Auto-generated by Firestore.
  - **Data:**
    - `applicantId` (string): The UID of the applicant who submitted the application.
    - `status` (string): The current status of the application (e.g., "submitted", "under review", "approved", "rejected").
    - `grantType` (string): The type of grant being applied for (e.g., "Research", "NextGen", "Non-Research").
    - `proposal` (string): The content of the grant proposal.
    - `submittedAt` (timestamp): The date and time the application was submitted.
    - `assignedReviewers` (array of strings): A list of reviewer UIDs who have been assigned to review the application.

- **`reviews`**: Stores the reviews of the grant applications submitted by reviewers.
  - **Document ID:** Auto-generated by Firestore.
  - **Data:**
    - `applicationId` (string): The ID of the application being reviewed.
    - `reviewerId` (string): The UID of the reviewer who submitted the review.
    - `rating` (number): The rating given by the reviewer.
    - `comments` (string): The comments provided by the reviewer.

- **`applicationCycles`**: Stores information about the application cycles.
  - **Document ID:** Auto-generated by Firestore.
  - **Data:**
    - `name` (string): The name of the application cycle (e.g., "Spring 2024").
    - `startDate` (timestamp): The start date of the application cycle.
    - `endDate` (timestamp): The end date of the application cycle.
    - `current` (boolean): Whether the application cycle is currently active.

- **`FAQs`**: Stores the frequently asked questions and their answers.
  - **Document ID:** Auto-generated by Firestore.
  - **Data:**
    - `question` (string)
    - `answer` (string)

### Firebase Storage

Firebase Storage is used to store files uploaded by users, such as grant proposals and other supporting documents. The files are stored in a secure and scalable object storage bucket.

#### How it Works

When an applicant uploads a file as part of their application, the following steps occur:

1.  **File Validation:** The application first validates the file to ensure it is a PDF and does not exceed the 50MB size limit.
2.  **Unique File Name:** A unique file name is generated for the file using `crypto.randomUUID()` to prevent naming conflicts.
3.  **Upload to Storage:** The file is then uploaded to the `pdfs/` directory in the Firebase Storage bucket.
4.  **Store File Reference:** The unique file name is stored in the corresponding application document in the Firestore database.

When a reviewer or administrator needs to view a file, the application retrieves the file's download URL from Firebase Storage using the unique file name stored in the Firestore document. This URL is then used to display the file to the user.

#### Key Functions

The following functions in `src/storage/storage.ts` are used to interact with Firebase Storage:

- **`uploadFileToStorage(file: File)`**: Uploads a file to Firebase Storage and returns the unique file name.
- **`downloadPDFByName(name: string)`**: Retrieves the download URL for a single PDF file by its unique name.
- **`downloadPDFsByName(names: string[])`**: Retrieves the download URLs for multiple PDF files by their unique names.
- **`listAndDownloadAllPDFs()`**: Lists all PDF files in the `pdfs/` directory and returns their names and download URLs.

## Authentication

The application implements role-based access control (RBAC) to restrict access to certain parts of the application based on the user's role. There are three main user roles:

- **Applicant:** Can create an account, submit grant applications, and view the status of their applications.
- **Reviewer:** Can view and evaluate assigned grant applications.
- **Admin:** Has full access to the system, including managing user accounts, application cycles, and grant awards.

The authentication logic is handled by the `AdminProtectedRoute`, `ApplicantProtectedRoute`, and `ReviewerProtectedRoute` components in `src/components/Routing`. These components check if the user is authenticated and has the required role before rendering the requested page.

## Routing

The application uses `react-router-dom` for routing. The main routing configuration is in `src/App.tsx`. The routes are defined using the `<Routes>` and `<Route>` components.

The application has public routes (e.g., `/login`, `/create-account-menu`) and protected routes for each user role.

## Key Components

- **`App.tsx`**: The main component that sets up the routing for the entire application.
- **`Sidebar.tsx`**: The sidebar component that provides navigation links based on the user's role.
- **`ApplicationForm.tsx`**: The component for the grant application form.
- **`AdminDashboardViewAll.tsx`**: The admin dashboard for viewing all accounts.
- **`ReviewerDashboard.tsx`**: The reviewer dashboard for viewing assigned applications.
- **`ApplicantDashboard.tsx`**: The applicant dashboard for managing applications.

## Deployment

To build the application for production, use the following command:

```bash
npm run build
```

This will create a `build` directory with the optimized and minified production build of the application. 

## Available Scripts

In the project directory, you can run:

- **`npm start`**: Runs the app in development mode.
- **`npm test`**: Launches the test runner in interactive watch mode.
- **`npm run build`**: Builds the app for production to the `build` folder.

### Firebase Cloud Functions

The project uses Firebase Cloud Functions to perform backend tasks that require elevated privileges, such as managing user roles and securely processing application submissions.

#### `submitApplication(request)`

- **Trigger:** HTTPS Callable
- **Description:** Securely processes grant application submissions with comprehensive server-side validation.
- **Parameters:**
  - `application` (object): Complete application data
  - `grantType` (string): "research", "nextgen", or "nonresearch"
  - `fileData` (string): Base64-encoded PDF file
  - `fileName` (string): Original file name
  - `fileType` (string): File MIME type
- **Returns:** Success confirmation with application ID
- **Security Features:** Authentication verification, role validation, deadline checking, duplicate prevention, file validation

#### `addReviewerRole(request)`

- **Trigger:** HTTPS Callable
- **Description:** Assigns the "reviewer" role to a user.
- **Parameters:**
  - `data.email` (string): The email address of the user to be made a reviewer.
- **Returns:** A success or error message.

#### `addApplicantRole(request)`

- **Trigger:** HTTPS Callable
- **Description:** Assigns the "applicant" role to a user.
- **Parameters:**
  - `data.email` (string): The email address of the user to be made an applicant.
- **Returns:** A success or error message.

#### `addAdminRole(request)`

- **Trigger:** HTTPS Callable
- **Description:** Assigns the "admin" role to a user.
- **Parameters:**
  - `data.email` (string): The email address of the user to be made an admin.
- **Returns:** A success or error message.

#### `getReviewers(request)`

- **Trigger:** HTTPS Request
- **Description:** Retrieves a list of all users with the "reviewer" role.
- **Returns:** A JSON object containing a list of reviewer user IDs.
