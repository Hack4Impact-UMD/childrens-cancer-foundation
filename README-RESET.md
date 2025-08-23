# Firebase Reset Scripts for Children's Cancer Foundation

This directory contains scripts to reset Firebase and Firestore to a clean slate before deployment. These scripts ensure that your Firebase project starts fresh while preserving all configuration files and security rules.

## Available Scripts

### 1. `reset-firebase.sh` (Recommended)
**Simple shell script that uses Firebase CLI commands**

- **Pros**: Easy to use, no additional dependencies, works with standard Firebase CLI
- **Cons**: May not clear all data in complex scenarios
- **Requirements**: Firebase CLI, bash shell

### 2. `reset-firebase-admin.js` 
**Node.js script that uses Firebase Admin SDK**

- **Pros**: More reliable data clearing, handles complex scenarios
- **Cons**: Requires service account key, additional setup
- **Requirements**: Node.js, Firebase CLI, service account key

### 3. `reset-firebase.js`
**Node.js script with mixed CLI and Admin SDK approach**

- **Pros**: Comprehensive approach, good error handling
- **Cons**: Complex, may require service account key for some operations
- **Requirements**: Node.js, Firebase CLI

## Quick Start (Recommended)

### Using the Shell Script

1. **Make sure you're in the project root directory**
   ```bash
   cd /path/to/childrens-cancer-foundation
   ```

2. **Check your Firebase setup**
   ```bash
   firebase --version
   firebase projects:list
   firebase use <your-project-id>
   ```

3. **Run the reset script**
   ```bash
   ./reset-firebase.sh --confirm
   ```

4. **Deploy your application**
   ```bash
   firebase deploy
   ```

## What the Scripts Do

### Data Cleared
- **Firestore Collections**: All documents in these collections:
  - `applications`
  - `applicationCycles`
  - `applicantUsers`
  - `reviewerUsers`
  - `reviews`
  - `decisions`
  - `post-grant-reports`
  - `faq`
  - `users`
  - `decision-data`
  - `applicants`
  - `reviewers`
  - `reviewer-whitelist`

- **Firebase Storage**: All files in the storage bucket
- **Firebase Functions**: All deployed functions
- **Firebase Authentication**: All user accounts (except testing accounts created by the script)

### Configuration Preserved
- **Firebase Configuration**: `firebase.json`
- **Security Rules**: `firestore.rules`, `storage.rules`
- **Indexes**: `firestore.indexes.json`
- **Function Configuration**: `functions/package.json`, `functions/tsconfig.json`, etc.

## Prerequisites

### For All Scripts
- Firebase CLI installed: `npm install -g firebase-tools`
- Authenticated with Firebase: `firebase login`
- Firebase project selected: `firebase use <project-id>`

### For Admin SDK Scripts (Optional)
- Node.js installed
- Service account key (see setup instructions below)

## Advanced Setup (Admin SDK Scripts)

### Getting a Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate new private key**
5. Save the JSON file as `serviceAccountKey.json` in the project root
6. Add `serviceAccountKey.json` to your `.gitignore` file

### Using Admin SDK Scripts

```bash
# Install dependencies
npm install firebase-admin

# Run the admin SDK script
node reset-firebase-admin.js --confirm
```

## Safety Features

### Confirmation Required
All scripts require the `--confirm` flag to prevent accidental execution:

```bash
# This will show what the script will do but won't execute
./reset-firebase.sh

# This will actually run the reset
./reset-firebase.sh --confirm
```

### Automatic Backup
The shell script automatically creates a backup of configuration files before making changes:

```
backup-1234567890/
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── functions/
    ├── package.json
    ├── tsconfig.json
    └── .eslintrc.js
```

### Error Handling
- Scripts check for Firebase CLI installation
- Verify authentication status
- Confirm project selection
- Graceful handling of missing collections/files
- Detailed logging of all operations

## Verification

After running a reset script, you can verify the cleanup:

```bash
# Check Firestore collections
firebase firestore:collections

# Check Storage files
firebase storage:list

# Check Functions
firebase functions:list

# Check Authentication users
firebase auth:export users.json --format=json
```

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

4. **"Permission denied" on shell script**
   ```bash
   chmod +x reset-firebase.sh
   ```

5. **"Service account key not found"**
   - Generate a service account key from Firebase Console
   - Save as `serviceAccountKey.json` in project root
   - Add to `.gitignore`

### Partial Failures

If some operations fail, the script will:
- Continue with other operations
- Log warnings for failed operations
- Provide guidance on manual cleanup if needed

## Post-Reset Steps

1. **Deploy your application**
   ```bash
   firebase deploy
   ```

2. **Test the application**
   - Verify all pages load correctly
   - Test user registration/login
   - Check admin functionality
   - Verify file uploads work

3. **Initialize required data**
   - Use the provided testing accounts or create admin users through the admin interface
   - Set up application cycles
   - Add FAQ entries
   - Configure any required settings

4. **Testing Accounts Created**
   The reset scripts automatically create three testing accounts:
   - **Admin**: `admin@test.com` / `testpass123` (role: admin)
   - **Applicant**: `applicant@test.com` / `testpass123` (role: applicant)
   - **Reviewer**: `reviewer@test.com` / `testpass123` (role: reviewer)

5. **Monitor for issues**
   - Check Firebase Console for any errors
   - Review application logs
   - Test all major user flows

## Security Considerations

- **Service Account Keys**: Never commit `serviceAccountKey.json` to version control
- **Backup Files**: Review backup directories before deleting
- **Production Data**: Always test reset scripts on development projects first
- **User Data**: Remember that all user data will be permanently deleted

## Support

If you encounter issues with the reset scripts:

1. Check the troubleshooting section above
2. Review the script logs for specific error messages
3. Verify your Firebase project configuration
4. Test with a development project first
5. Contact the development team for assistance

## Script Maintenance

The reset scripts are designed to work with the current Firebase project structure. If you modify the project structure, you may need to update the scripts:

- Update collection names in the scripts if you change Firestore collections
- Modify file paths if you restructure the project
- Update security rules if you change the rule structure

## Version History

- **v1.0**: Initial release with shell script
- **v1.1**: Added Node.js Admin SDK script
- **v1.2**: Enhanced error handling and verification
- **v1.3**: Added comprehensive documentation and troubleshooting
