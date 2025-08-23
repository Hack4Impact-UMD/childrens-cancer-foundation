# Complete Firebase Reset and Deployment Workflow

This document outlines the complete workflow for resetting Firebase and deploying the Children's Cancer Foundation application.

## Overview

The workflow consists of three main phases:
1. **Reset Phase**: Clear all Firebase data while preserving configuration
2. **Verification Phase**: Ensure the reset was successful
3. **Deployment Phase**: Deploy the application to Firebase

## Prerequisites

Before starting, ensure you have:

- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Authenticated with Firebase: `firebase login`
- [ ] Selected your Firebase project: `firebase use <project-id>`
- [ ] Node.js installed (for React build and tests)

## Phase 1: Reset Firebase

### Step 1: Choose Your Reset Method

You have three options for resetting Firebase:

#### Option A: Shell Script (Recommended for most users)
```bash
./reset-firebase.sh --confirm
```

#### Option B: Admin SDK Script (For complex scenarios)
```bash
# First, get a service account key from Firebase Console
# Save it as serviceAccountKey.json in the project root
npm install firebase-admin
node reset-firebase-admin.js --confirm
```

#### Option C: Node.js Script (Mixed approach)
```bash
node reset-firebase.js --confirm
```

### Step 2: What Gets Reset

The reset scripts will clear:

- **Firestore Collections**:
  - `applications` - All grant applications
  - `applicationCycles` - Application cycle configurations
  - `applicantUsers` - Applicant user data
  - `reviewerUsers` - Reviewer user data
  - `reviews` - Application reviews
  - `decisions` - Application decisions
  - `post-grant-reports` - Post-grant reports
  - `faq` - FAQ entries
  - `users` - General user data
  - `decision-data` - Decision-related data
  - `applicants` - Applicant profiles
  - `reviewers` - Reviewer profiles
  - `reviewer-whitelist` - Reviewer whitelist

- **Firebase Storage**: All uploaded files (PDFs, etc.)
- **Firebase Functions**: All deployed functions
- **Firebase Authentication**: All user accounts (except testing accounts created by the script)

### Step 3: What Gets Preserved

The reset scripts preserve:

- **Configuration Files**:
  - `firebase.json` - Firebase project configuration
  - `firestore.rules` - Firestore security rules
  - `firestore.indexes.json` - Firestore indexes
  - `storage.rules` - Storage security rules
  - `functions/package.json` - Functions dependencies
  - `functions/tsconfig.json` - TypeScript configuration

- **Application Code**: All React application code remains intact
- **Backup**: Configuration files are automatically backed up

### Step 4: What Gets Created

The reset scripts create:

- **Testing Accounts**: Three test accounts with proper user claims:
  - **Admin**: `admin@test.com` / `testpass123` (role: admin)
  - **Applicant**: `applicant@test.com` / `testpass123` (role: applicant)
  - **Reviewer**: `reviewer@test.com` / `testpass123` (role: reviewer)

## Phase 2: Verification

### Step 1: Run Verification Tests

After the reset, verify everything is working:

```bash
node test-reset.js
```

This will test:
- [ ] Firebase CLI connectivity
- [ ] Firestore collections are empty
- [ ] Storage is empty
- [ ] Functions are cleared
- [ ] Authentication users are cleared
- [ ] Configuration files are intact
- [ ] Deployment capability
- [ ] React app structure

### Step 2: Manual Verification

You can also manually verify:

```bash
# Check Firestore
firebase firestore:collections

# Check Storage
firebase storage:list

# Check Functions
firebase functions:list

# Check Authentication
firebase auth:export users.json --format=json
```

## Phase 3: Deployment

### Step 1: Deploy the Application

Use the deployment script:

```bash
# Deploy with React build
./deploy.sh --build

# Deploy with tests
./deploy.sh --build --test

# Deploy without building (if already built)
./deploy.sh
```

### Step 2: What Gets Deployed

The deployment script will:

1. **Build React App** (if `--build` flag is used):
   - Install dependencies
   - Build the production version
   - Copy build files to `public/` directory

2. **Deploy Firebase Configuration**:
   - Firestore rules and indexes
   - Storage rules
   - Functions (if any)

3. **Deploy Hosting**:
   - Copy React build to hosting
   - Deploy to Firebase hosting

### Step 3: Get Deployment URL

The script will provide the deployment URL, or you can find it in:
- Firebase Console > Hosting
- Or run: `firebase hosting:channel:list`

## Post-Deployment Setup

### Step 1: Initialize Required Data

After deployment, you'll need to set up:

1. **Admin Users**:
   - Use the provided testing accounts or create admin accounts through the application
   - Set up proper role assignments

2. **Application Cycles**:
   - Create new application cycles
   - Set start/end dates
   - Configure cycle settings

3. **FAQ Entries**:
   - Add frequently asked questions
   - Organize by categories

4. **System Configuration**:
   - Configure any application-specific settings
   - Set up email notifications (if applicable)

5. **Testing Accounts**:
   The reset scripts automatically create three testing accounts:
   - **Admin**: `admin@test.com` / `testpass123` (role: admin)
   - **Applicant**: `applicant@test.com` / `testpass123` (role: applicant)
   - **Reviewer**: `reviewer@test.com` / `testpass123` (role: reviewer)

### Step 2: Testing

Test all major functionality:

- [ ] User registration and login
- [ ] Application submission
- [ ] File uploads
- [ ] Admin dashboard
- [ ] Reviewer workflow
- [ ] Post-grant reports
- [ ] FAQ system

## Troubleshooting

### Common Issues

1. **"Firebase CLI not found"**
   ```bash
   npm install -g firebase-tools
   ```

2. **"Not authenticated"**
   ```bash
   firebase login
   ```

3. **"No project selected"**
   ```bash
   firebase use <your-project-id>
   ```

4. **"Permission denied" on scripts**
   ```bash
   chmod +x reset-firebase.sh deploy.sh
   ```

5. **Build failures**
   ```bash
   cd react-app/ccf
   npm install
   npm run build
   ```

### Partial Reset Failures

If some operations fail during reset:

1. **Check the logs** for specific error messages
2. **Manually clear** remaining data using Firebase Console
3. **Re-run the reset script** to clear remaining items
4. **Contact the development team** if issues persist

### Deployment Issues

If deployment fails:

1. **Check Firebase project configuration**
2. **Verify all configuration files are intact**
3. **Ensure React app builds successfully**
4. **Check Firebase Console for error details**

## Security Considerations

### Service Account Keys

If using Admin SDK scripts:
- Never commit `serviceAccountKey.json` to version control
- Add it to `.gitignore`
- Keep the key secure and rotate regularly

### Production Deployment

- Always test reset scripts on development projects first
- Backup important data before running reset on production
- Review all changes in Firebase Console after reset
- Monitor application logs for any issues

## Script Maintenance

The scripts are designed for the current project structure. If you modify:

- **Firestore Collections**: Update collection names in reset scripts
- **Project Structure**: Modify file paths in scripts
- **Security Rules**: Update rule validation in scripts
- **Dependencies**: Update package.json references

## Quick Reference

### Complete Workflow (One-liner)
```bash
./reset-firebase.sh --confirm && node test-reset.js && ./deploy.sh --build --test
```

### Individual Commands
```bash
# Reset
./reset-firebase.sh --confirm

# Verify
node test-reset.js

# Deploy
./deploy.sh --build

# Check status
firebase projects:list
firebase use <project-id>
```

### Emergency Rollback
If something goes wrong:
1. Check the backup directory created by the reset script
2. Restore configuration files if needed
3. Re-deploy: `firebase deploy`
4. Contact the development team

## Support

For issues with the reset and deployment workflow:

1. Check this documentation
2. Review script logs for error messages
3. Test with a development project first
4. Contact the development team with specific error details

## Version History

- **v1.0**: Initial workflow with shell script
- **v1.1**: Added Admin SDK option and verification tests
- **v1.2**: Enhanced deployment script with build options
- **v1.3**: Comprehensive documentation and troubleshooting
