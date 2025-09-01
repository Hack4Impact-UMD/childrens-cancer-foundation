#!/usr/bin/env python3
"""
CSS Forward Slash Finder
Searches through CSS files to find potentially problematic forward slashes
that might cause CSS minification errors.

AGGRESSIVE SCAN VERSION: This version is designed for debugging build
errors. It flags any line with a forward slash that isn't in an
obvious safe context (like a URL or comment) to help find obscure errors.
"""

import os
import re
import argparse
from pathlib import Path

def find_problematic_slashes(file_path):
    """
    Finds potentially problematic forward slashes in a given CSS file.
    This is an AGGRESSIVE version for debugging. It will flag almost any
    line with a '/' that isn't obviously a URL or comment.
    """
    issues = []
    try:
        # Ensure the path is a file before attempting to open it.
        if not file_path.is_file():
            return []
            
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            lines = file.readlines()

        for line_num, line in enumerate(lines, 1):
            if '/' in line:
                line_stripped = line.strip()

                # --- IGNORE LIST ---
                # This section contains patterns that are generally safe.
                # If a line contains one of these, we'll skip it to reduce false positives.

                # Ignore full URLs or protocol-relative URLs
                if 'url(' in line or 'http:' in line or 'https:' in line:
                    continue
                # Ignore data URIs (e.g., for embedded images or fonts)
                if 'data:image/' in line or 'data:font/' in line:
                    continue
                # Ignore lines that are clearly CSS comments
                if '/*' in line:
                    continue
                # Ignore SCSS/Less style single-line comments
                if line_stripped.startswith('//'):
                    continue
                # Ignore valid division in calc()
                if 'calc(' in line and '/' in line:
                    continue
                # Ignore slashes in SVG path data (often in 'd' attributes)
                if ' d=' in line and '/>' in line:
                    continue

                # If the line has a slash and wasn't ignored, flag it.
                issues.append({
                    'type': 'Potential Problematic Slash',
                    'line': line_num,
                    'content': line_stripped,
                    'pattern': 'Aggressive Scan: Flagged line with "/"'
                })
    except Exception as e:
        # Handle potential file reading errors gracefully.
        print(f"Error processing file {file_path}: {e}")
        return []
        
    return issues

def scan_directory(directory, extensions=None, skip_node_modules=True):
    """
    Scans a directory recursively for files with specified extensions and analyzes them.
    """
    if extensions is None:
        extensions = ['.css', '.scss', '.sass', '.less']
    
    directory = Path(directory)
    css_files = []
    
    # Find all files matching the given extensions.
    for ext in extensions:
        found_files = list(directory.rglob(f'*{ext}'))
        
        # Optionally filter out common dependency and build directories.
        if skip_node_modules:
            found_files = [
                f for f in found_files 
                if not any(part in ['node_modules', '.git', 'build', 'dist', '.next'] 
                          for part in f.parts)
            ]
        
        css_files.extend(found_files)
    
    total_issues = 0
    files_with_issues = 0
    
    print(f"🔍 Starting aggressive scan on {len(css_files)} files in '{directory}'...")
    if skip_node_modules:
        print("📁 Skipping node_modules, .git, build, dist, and .next directories...")
    print("-" * 60)
    
    for css_file in sorted(css_files):
        issues = find_problematic_slashes(css_file)
        
        if issues:
            files_with_issues += 1
            total_issues += len(issues)
            
            print(f"\n📄 {css_file.relative_to(directory)}")
            print("=" * 40)
            
            for issue in issues:
                print(f"  Line {issue['line']:<4}: {issue['type']}")
                print(f"    - Content: {issue['content']}")
                print()
    
    # Print a final summary of the scan.
    print("\n" + "=" * 60)
    print("📊 AGGRESSIVE SCAN SUMMARY")
    print("=" * 60)
    print(f"Files scanned: {len(css_files)}")
    print(f"Files with issues: {files_with_issues}")
    print(f"Total issues found: {total_issues}")
    
    if total_issues == 0:
        print("\n✅ No suspicious forward slashes found, even with aggressive scanning.")
    else:
        print(f"\n⚠️  Found {total_issues} potential issues in {files_with_issues} files.")
        print("\nReview the lines listed above. The error is likely in one of them.")
        print("Common fixes include quoting URLs, ensuring comments are valid (`/* comment */`),")
        print("or using `calc()` for mathematical division.")

def main():
    """
    Parses command-line arguments and initiates the directory scan.
    """
    parser = argparse.ArgumentParser(
        description="Find potentially problematic forward slashes in CSS files.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "directory", 
        nargs="?", 
        default=".", 
        help="Directory to scan (default: current directory)."
    )
    parser.add_argument(
        "--extensions", 
        nargs="+", 
        default=[".css", ".scss", ".sass", ".less"],
        help="File extensions to scan (e.g., --extensions .css .scss)."
    )
    parser.add_argument(
        "--include-node-modules",
        action="store_true",
        help="Include node_modules directory in the scan (skipped by default)."
    )
    
    args = parser.parse_args()
    
    scan_dir = Path(args.directory)
    
    if not scan_dir.exists():
        print(f"❌ Error: Directory '{scan_dir}' does not exist!")
        return 1
    
    if not scan_dir.is_dir():
        print(f"❌ Error: '{scan_dir}' is not a directory!")
        return 1
    
    # Determine whether to skip node_modules based on the flag.
    skip_node_modules = not args.include_node_modules
    scan_directory(scan_dir, args.extensions, skip_node_modules)
    
    return 0

if __name__ == "__main__":
    exit(main())
