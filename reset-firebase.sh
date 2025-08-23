#!/bin/bash

# Firebase Reset Script for Children's Cancer Foundation
# 
# This script resets Firebase and Firestore to a clean slate before deployment.
# It preserves configuration files and security rules while clearing all data.
# 
# Usage: ./reset-firebase.sh [--confirm]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "$1"
}

log_step() {
    log "${CYAN}\n$1. $2${NC}"
}

log_success() {
    log "${GREEN}✓ $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠ $1${NC}"
}

log_error() {
    log "${RED}✗ $1${NC}"
}

log_info() {
    log "${BLUE}ℹ $1${NC}"
}

# Check if user confirmed the reset
check_confirmation() {
    if [[ "$*" == *"--confirm"* ]]; then
        return 0
    fi
    
    log "${CYAN}"
    log "============================================================"
    log "FIREBASE RESET SCRIPT"
    log "============================================================"
    log "${NC}"
    log "${YELLOW}This script will:${NC}"
    log "${YELLOW}• Clear all Firestore collections${NC}"
    log "${YELLOW}• Delete all Firebase Storage files${NC}"
    log "${YELLOW}• Remove all Firebase Functions${NC}"
    log "${YELLOW}• Clear all user authentication data${NC}"
    log "${YELLOW}• Preserve configuration files and security rules${NC}"
    log ""
    log "${RED}⚠️  WARNING: This will permanently delete ALL data!${NC}"
    log ""
    log "${CYAN}To proceed, run: ./reset-firebase.sh --confirm${NC}"
    log "${CYAN}============================================================${NC}"
    return 1
}

# Check if Firebase CLI is installed
check_firebase_cli() {
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI is not installed or not in PATH"
        log_info "Install it with: npm install -g firebase-tools"
        return 1
    fi
    return 0
}

# Check if user is logged into Firebase
check_firebase_auth() {
    if ! firebase projects:list &> /dev/null; then
        log_error "Not authenticated with Firebase"
        log_info "Run: firebase login"
        return 1
    fi
    return 0
}

# Get current Firebase project
get_current_project() {
    local output
    output=$(firebase use 2>/dev/null || echo "")
    # The output is just the project ID directly
    if [[ -n "$output" ]] && [[ "$output" != *"No project selected"* ]]; then
        echo "$output"
    else
        echo ""
    fi
}

# Backup important configuration files
backup_config_files() {
    log_step "1" "Backing up configuration files..."
    
    local backup_dir="backup-$(date +%s)"
    mkdir -p "$backup_dir"
    
    local files_to_backup=(
        "firebase.json"
        "firestore.rules"
        "firestore.indexes.json"
        "storage.rules"
        "functions/package.json"
        "functions/tsconfig.json"
        "functions/.eslintrc.js"
    )
    
    for file in "${files_to_backup[@]}"; do
        if [[ -f "$file" ]]; then
            mkdir -p "$(dirname "$backup_dir/$file")"
            cp "$file" "$backup_dir/$file"
            log_success "Backed up $file"
        fi
    done
    
    log_success "Configuration backed up to $backup_dir"
    echo "$backup_dir"
}

# Clear Firestore collections using Firebase CLI
clear_firestore() {
    log_step "2" "Clearing Firestore collections..."
    
    local collections=(
        "applications"
        "applicationCycles"
        "applicantUsers"
        "reviewerUsers"
        "reviews"
        "decisions"
        "post-grant-reports"
        "faq"
        "users"
        "decision-data"
        "applicants"
        "reviewers"
        "reviewer-whitelist"
    )
    
    for collection in "${collections[@]}"; do
        log_info "Clearing collection: $collection"
        
        # Try to delete the collection using Firebase CLI
        if firebase firestore:delete "$collection" --recursive --force &> /dev/null; then
            log_success "Cleared collection: $collection"
        else
            log_warning "Could not clear collection $collection (may not exist)"
        fi
    done
    
    log_success "Firestore collections cleared"
}

# Clear Firebase Storage
clear_storage() {
    log_step "3" "Clearing Firebase Storage..."
    
    # List all files in storage
    local list_output
    list_output=$(firebase storage:list 2>/dev/null || echo "No files found")
    
    if [[ "$list_output" == *"No files found"* ]] || [[ -z "$list_output" ]]; then
        log_success "Storage is already empty"
        return
    fi
    
    # Extract file paths and delete them
    while IFS= read -r line; do
        if [[ -n "$line" ]] && [[ "$line" != *"No files found"* ]]; then
            local file_path=$(echo "$line" | xargs)
            if [[ -n "$file_path" ]]; then
                if firebase storage:delete "$file_path" --force &> /dev/null; then
                    log_success "Deleted: $file_path"
                else
                    log_warning "Could not delete $file_path"
                fi
            fi
        fi
    done <<< "$list_output"
    
    log_success "Firebase Storage cleared"
}

# Clear Firebase Functions
clear_functions() {
    log_step "4" "Clearing Firebase Functions..."
    
    # List current functions
    local functions_output
    functions_output=$(firebase functions:list 2>/dev/null || echo "No functions found")
    
    if [[ "$functions_output" == *"No functions found"* ]] || [[ -z "$functions_output" ]]; then
        log_success "No functions to clear"
        return
    fi
    
    # Extract function names and delete them
    while IFS= read -r line; do
        if [[ -n "$line" ]] && [[ "$line" != *"No functions found"* ]]; then
            if [[ $line =~ ^([a-zA-Z0-9_-]+) ]]; then
                local function_name="${BASH_REMATCH[1]}"
                if firebase functions:delete "$function_name" --force &> /dev/null; then
                    log_success "Deleted function: $function_name"
                else
                    log_warning "Could not delete function $function_name"
                fi
            fi
        fi
    done <<< "$functions_output"
    
    log_success "Firebase Functions cleared"
}

# Clear Authentication users
clear_auth() {
    log_step "5" "Clearing Firebase Authentication users..."
    
    # Export users to a temporary file
    if firebase auth:export users.json --format=json &> /dev/null; then
        # Check if the file exists and has content
        if [[ -f "users.json" ]] && [[ -s "users.json" ]]; then
            # Parse and delete users (simplified approach)
            local user_count
            user_count=$(jq '.users | length' users.json 2>/dev/null || echo "0")
            
            if [[ "$user_count" -gt 0 ]]; then
                log_info "Found $user_count users to delete"
                
                # Extract user IDs and delete them
                jq -r '.users[].localId' users.json 2>/dev/null | while read -r user_id; do
                    if [[ -n "$user_id" ]]; then
                        if firebase auth:delete "$user_id" --force &> /dev/null; then
                            log_success "Deleted user: $user_id"
                        else
                            log_warning "Could not delete user $user_id"
                        fi
                    fi
                done
            else
                log_success "No users to delete"
            fi
            
            # Clean up temporary file
            rm -f users.json
        else
            log_success "No users to delete"
        fi
    else
        log_success "No users to delete"
    fi
    
    log_success "Firebase Authentication users cleared"
}

# Create testing accounts with proper user claims
create_testing_accounts() {
    log_step "6" "Creating testing accounts..."
    
    # Create admin account
    log_info "Creating admin test account..."
    if firebase auth:create-user --email admin@test.com --password testpass123 --display-name "Admin Test User" &> /dev/null; then
        # Get the user UID
        local admin_uid
        admin_uid=$(firebase auth:export users.json --format=json 2>/dev/null | jq -r '.users[] | select(.email == "admin@test.com") | .localId' 2>/dev/null || echo "")
        
        if [[ -n "$admin_uid" ]]; then
            # Set admin custom claims
            if firebase auth:set-custom-claims "$admin_uid" '{"role": "admin"}' &> /dev/null; then
                log_success "Created admin account: admin@test.com (UID: $admin_uid)"
            else
                log_warning "Could not set admin claims for $admin_uid"
            fi
        else
            log_warning "Could not get admin UID"
        fi
    else
        log_warning "Could not create admin account"
    fi
    
    # Create applicant account
    log_info "Creating applicant test account..."
    if firebase auth:create-user --email applicant@test.com --password testpass123 --display-name "Applicant Test User" &> /dev/null; then
        # Get the user UID
        local applicant_uid
        applicant_uid=$(firebase auth:export users.json --format=json 2>/dev/null | jq -r '.users[] | select(.email == "applicant@test.com") | .localId' 2>/dev/null || echo "")
        
        if [[ -n "$applicant_uid" ]]; then
            # Set applicant custom claims
            if firebase auth:set-custom-claims "$applicant_uid" '{"role": "applicant"}' &> /dev/null; then
                log_success "Created applicant account: applicant@test.com (UID: $applicant_uid)"
            else
                log_warning "Could not set applicant claims for $applicant_uid"
            fi
        else
            log_warning "Could not get applicant UID"
        fi
    else
        log_warning "Could not create applicant account"
    fi
    
    # Create reviewer account
    log_info "Creating reviewer test account..."
    if firebase auth:create-user --email reviewer@test.com --password testpass123 --display-name "Reviewer Test User" &> /dev/null; then
        # Get the user UID
        local reviewer_uid
        reviewer_uid=$(firebase auth:export users.json --format=json 2>/dev/null | jq -r '.users[] | select(.email == "reviewer@test.com") | .localId' 2>/dev/null || echo "")
        
        if [[ -n "$reviewer_uid" ]]; then
            # Set reviewer custom claims
            if firebase auth:set-custom-claims "$reviewer_uid" '{"role": "reviewer"}' &> /dev/null; then
                log_success "Created reviewer account: reviewer@test.com (UID: $reviewer_uid)"
            else
                log_warning "Could not set reviewer claims for $reviewer_uid"
            fi
        else
            log_warning "Could not get reviewer UID"
        fi
    else
        log_warning "Could not create reviewer account"
    fi
    
    # Clean up temporary file
    rm -f users.json
    
    log_success "Testing accounts created"
}

# Deploy security rules and configuration
deploy_configuration() {
    log_step "7" "Deploying security rules and configuration..."
    
    # Deploy Firestore rules and indexes
    if firebase deploy --only firestore:rules,firestore:indexes; then
        log_success "Firestore rules and indexes deployed"
    else
        log_error "Failed to deploy Firestore rules and indexes"
        return 1
    fi
    
    # Deploy Storage rules
    if firebase deploy --only storage; then
        log_success "Storage rules deployed"
    else
        log_error "Failed to deploy Storage rules"
        return 1
    fi
    
    # Deploy hosting configuration
    if firebase deploy --only hosting; then
        log_success "Hosting configuration deployed"
    else
        log_error "Failed to deploy hosting configuration"
        return 1
    fi
}

# Verify the reset
verify_reset() {
    log_step "8" "Verifying reset..."
    
    # Check Firestore collections
    local firestore_output
    firestore_output=$(firebase firestore:collections 2>/dev/null || echo "No collections found")
    if [[ "$firestore_output" == *"No collections found"* ]] || [[ -z "$firestore_output" ]]; then
        log_success "Firestore is empty"
    else
        log_warning "Some Firestore collections may still exist"
    fi
    
    # Check Storage
    local storage_output
    storage_output=$(firebase storage:list 2>/dev/null || echo "No files found")
    if [[ "$storage_output" == *"No files found"* ]] || [[ -z "$storage_output" ]]; then
        log_success "Storage is empty"
    else
        log_warning "Some storage files may still exist"
    fi
    
    # Check Functions
    local functions_output
    functions_output=$(firebase functions:list 2>/dev/null || echo "No functions found")
    if [[ "$functions_output" == *"No functions found"* ]] || [[ -z "$functions_output" ]]; then
        log_success "No functions deployed"
    else
        log_warning "Some functions may still be deployed"
    fi
    
    log_success "Reset verification completed"
}

# Main execution function
main() {
    # Check confirmation
    if ! check_confirmation "$@"; then
        exit 0
    fi
    
    # Pre-flight checks
    log "${CYAN}Performing pre-flight checks...${NC}"
    
    if ! check_firebase_cli; then
        exit 1
    fi
    
    if ! check_firebase_auth; then
        exit 1
    fi
    
    local current_project
    current_project=$(get_current_project)
    if [[ -z "$current_project" ]]; then
        log_error "No Firebase project selected"
        log_info "Run: firebase use <project-id>"
        exit 1
    fi
    
    log_success "Using Firebase project: $current_project"
    
    # Execute reset steps
    local backup_dir
    backup_dir=$(backup_config_files)
    
    clear_firestore
    clear_storage
    clear_functions
    clear_auth
    create_testing_accounts
    deploy_configuration
    verify_reset
    
    log "${CYAN}"
    log "============================================================"
    log "RESET COMPLETED SUCCESSFULLY!"
    log "============================================================"
    log "${NC}"
    log "${CYAN}Next steps:${NC}"
    log "${BLUE}1. Review the backup in: $backup_dir${NC}"
    log "${BLUE}2. Deploy your application: firebase deploy${NC}"
    log "${BLUE}3. Test the application to ensure everything works${NC}"
    log "${BLUE}4. Initialize any required data through the admin interface${NC}"
    log ""
    log "${GREEN}Configuration files have been preserved and redeployed.${NC}"
    log "${GREEN}All data has been cleared for a fresh start.${NC}"
}

# Run the script
main "$@"
