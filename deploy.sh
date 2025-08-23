#!/bin/bash

# Deployment Script for Children's Cancer Foundation
# 
# This script deploys the application after a Firebase reset.
# Run this after using one of the reset scripts.
# 
# Usage: ./deploy.sh [--build] [--test]

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

# Check if build flag is set
BUILD_FLAG=false
TEST_FLAG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD_FLAG=true
            shift
            ;;
        --test)
            TEST_FLAG=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            log_info "Usage: ./deploy.sh [--build] [--test]"
            exit 1
            ;;
    esac
done

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
    if [[ $output =~ "Currently active: (.+)" ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo ""
    fi
}

# Build the React application
build_react_app() {
    log_step "1" "Building React application..."
    
    if [[ ! -d "react-app/ccf" ]]; then
        log_error "React app directory not found"
        return 1
    fi
    
    cd react-app/ccf
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm install
    fi
    
    # Build the application
    log_info "Building application..."
    if npm run build; then
        log_success "React application built successfully"
    else
        log_error "Failed to build React application"
        return 1
    fi
    
    cd ../..
}

# Deploy Firebase configuration
deploy_firebase_config() {
    log_step "2" "Deploying Firebase configuration..."
    
    # Deploy Firestore rules and indexes
    log_info "Deploying Firestore rules and indexes..."
    if firebase deploy --only firestore:rules,firestore:indexes; then
        log_success "Firestore rules and indexes deployed"
    else
        log_error "Failed to deploy Firestore rules and indexes"
        return 1
    fi
    
    # Deploy Storage rules
    log_info "Deploying Storage rules..."
    if firebase deploy --only storage; then
        log_success "Storage rules deployed"
    else
        log_error "Failed to deploy Storage rules"
        return 1
    fi
    
    # Deploy Functions (if any)
    log_info "Deploying Functions..."
    if firebase deploy --only functions; then
        log_success "Functions deployed"
    else
        log_warning "No functions to deploy or deployment failed"
    fi
}

# Deploy hosting
deploy_hosting() {
    log_step "3" "Deploying hosting..."
    
    # Copy React build to public directory
    if [[ -d "react-app/ccf/build" ]]; then
        log_info "Copying React build to public directory..."
        rm -rf public/*
        cp -r react-app/ccf/build/* public/
        log_success "React build copied to public directory"
    else
        log_error "React build directory not found"
        return 1
    fi
    
    # Deploy hosting
    log_info "Deploying to Firebase hosting..."
    if firebase deploy --only hosting; then
        log_success "Hosting deployed successfully"
    else
        log_error "Failed to deploy hosting"
        return 1
    fi
}

# Run tests (if requested)
run_tests() {
    if [[ "$TEST_FLAG" == true ]]; then
        log_step "4" "Running tests..."
        
        # Run the test script
        if command -v node &> /dev/null; then
            if [[ -f "test-reset.js" ]]; then
                log_info "Running reset verification tests..."
                node test-reset.js
                log_success "Tests completed"
            else
                log_warning "Test script not found"
            fi
        else
            log_warning "Node.js not available for running tests"
        fi
    fi
}

# Get deployment URL
get_deployment_url() {
    log_step "5" "Getting deployment information..."
    
    # Get the hosting URL
    local hosting_output
    hosting_output=$(firebase hosting:channel:list 2>/dev/null || echo "")
    
    if [[ $hosting_output =~ "live" ]]; then
        local url_match
        url_match=$(echo "$hosting_output" | grep "live" | head -1)
        if [[ $url_match =~ https://[^\s]+ ]]; then
            local url="${BASH_REMATCH[0]}"
            log_success "Application deployed to: $url"
        else
            log_info "Deployment completed. Check Firebase Console for URL."
        fi
    else
        log_info "Deployment completed. Check Firebase Console for URL."
    fi
}

# Main execution function
main() {
    log "${CYAN}============================================================"
    log "DEPLOYMENT SCRIPT"
    log "============================================================${NC}"
    
    # Pre-flight checks
    log "\nPerforming pre-flight checks...${NC}"
    
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
    
    # Build React app if requested
    if [[ "$BUILD_FLAG" == true ]]; then
        if ! build_react_app; then
            exit 1
        fi
    else
        log_info "Skipping build (use --build to build React app)"
    fi
    
    # Deploy Firebase configuration
    if ! deploy_firebase_config; then
        exit 1
    fi
    
    # Deploy hosting
    if ! deploy_hosting; then
        exit 1
    fi
    
    # Run tests if requested
    run_tests
    
    # Get deployment information
    get_deployment_url
    
    log "${CYAN}"
    log "============================================================"
    log "DEPLOYMENT COMPLETED SUCCESSFULLY!"
    log "============================================================${NC}"
    log "\n${CYAN}Next steps:${NC}"
    log "${BLUE}1. Test the deployed application thoroughly${NC}"
    log "${BLUE}2. Initialize any required data through the admin interface${NC}"
    log "${BLUE}3. Set up application cycles and FAQ entries${NC}"
    log "${BLUE}4. Create admin users as needed${NC}"
    log "\n${GREEN}Your application is now live and ready for use!${NC}"
}

# Run the script
main "$@"
