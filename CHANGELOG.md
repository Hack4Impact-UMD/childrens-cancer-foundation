# Firebase Reset Scripts - Changelog

## Version 1.4 - Testing Accounts and Additional Collections

### Added
- **New Firestore Collections**: Added clearing for additional collections:
  - `applicants` - Applicant profiles
  - `reviewers` - Reviewer profiles  
  - `reviewer-whitelist` - Reviewer whitelist

- **Testing Accounts**: Automatic creation of three testing accounts with proper user claims:
  - **Admin**: `admin@test.com` / `testpass123` (role: admin)
  - **Applicant**: `applicant@test.com` / `testpass123` (role: applicant)
  - **Reviewer**: `reviewer@test.com` / `testpass123` (role: reviewer)

### Updated
- **Shell Script** (`reset-firebase.sh`):
  - Added missing collections to clear list
  - Added `create_testing_accounts()` function
  - Updated step numbering
  - Added testing account creation to main workflow

- **Admin SDK Script** (`reset-firebase-admin.js`):
  - Added missing collections to clear list
  - Added `createTestingAccountsScript()` function
  - Added `createTestingAccounts()` function
  - Updated step numbering
  - Added testing account creation to main workflow

- **Node.js Script** (`reset-firebase.js`):
  - Added missing collections to clear list
  - Added `createTestingAccounts()` function
  - Updated step numbering
  - Added testing account creation to main workflow

- **Test Script** (`test-reset.js`):
  - Added testing account verification
  - Added test for testing accounts availability

- **Documentation**:
  - Updated `README-RESET.md` with new collections and testing accounts
  - Updated `WORKFLOW.md` with testing account information
  - Added testing account credentials to documentation

### Technical Details
- Testing accounts are created with Firebase Authentication
- Custom claims are set using Firebase CLI or Admin SDK
- All testing accounts use the same password: `testpass123`
- User roles are set as custom claims: `{"role": "admin"}` etc.
- Testing accounts are preserved during reset (not deleted)

### Usage
The testing accounts can be used immediately after running any reset script:

```bash
# Run reset script
./reset-firebase.sh --confirm

# Login with testing accounts
# Admin: admin@test.com / testpass123
# Applicant: applicant@test.com / testpass123  
# Reviewer: reviewer@test.com / testpass123
```

### Security Note
- Testing accounts are for development/testing only
- Change passwords in production environments
- Consider deleting testing accounts before production deployment
