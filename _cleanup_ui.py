#!/usr/bin/env python3
"""
Remove hover: and group-hover: utility classes, border-border colors, and active:scale 
from Tailwind className strings in .tsx files ONLY.
Preserves all other whitespace and formatting.
Does NOT touch API route files.
"""
import os
import re
import glob

# Only process UI files, not API routes or data files
PATTERNS = [
    'src/app/**/page.tsx',
    'src/app/**/layout.tsx',
    'src/app/**/DestinationDetailContent.tsx',
    'src/components/*.tsx',
    'src/app/not-found.tsx',
]

SKIP_DIRS = ['src/app/api/', 'src/app/admin/']  # Keep admin functional

def remove_classes_from_string(match):
    """Remove specific utility classes from a className string value."""
    full = match.group(0)
    quote = full[0]  # " or ' or `
    content = full[1:-1]
    
    # Remove hover:xxx patterns
    content = re.sub(r'\s+hover:[a-zA-Z0-9_\-\[\]\.\/\#\(\)]+', '', content)
    content = re.sub(r'^hover:[a-zA-Z0-9_\-\[\]\.\/\#\(\)]+\s*', '', content)
    
    # Remove group-hover:xxx patterns
    content = re.sub(r'\s+group-hover:[a-zA-Z0-9_\-\[\]\.\/\#\(\)]+', '', content)
    content = re.sub(r'^group-hover:[a-zA-Z0-9_\-\[\]\.\/\#\(\)]+\s*', '', content)
    
    # Remove active:scale-xxx patterns
    content = re.sub(r'\s+active:scale-[a-zA-Z0-9_\-\[\]\.]+', '', content)
    content = re.sub(r'^active:scale-[a-zA-Z0-9_\-\[\]\.]+\s*', '', content)
    
    # Remove border-border color references (keep border width classes like border, border-t, border-2)
    content = re.sub(r'\s+border-border(?:/\d+)?', '', content)
    content = re.sub(r'^border-border(?:/\d+)?\s*', '', content)
    
    # Remove standalone "border" that is just a border width with no color (if border-border was removed)
    # Actually, keep "border" since it sets width - only border-border was the color
    
    # Clean up double spaces
    content = re.sub(r'  +', ' ', content).strip()
    
    return quote + content + quote

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Only modify strings that look like className values
    # Match quoted strings that contain hover: or group-hover: or border-border or active:scale
    # This is conservative - only processes strings that actually have these patterns
    content = re.sub(
        r'["\'][^"\']*(?:hover:|group-hover:|border-border|active:scale)[^"\']*["\']',
        remove_classes_from_string,
        content
    )
    
    # Also handle template literals with these classes
    # But be more careful - only single-line template parts
    content = re.sub(
        r'`[^`]*(?:hover:|group-hover:|border-border|active:scale)[^`]*`',
        remove_classes_from_string,
        content
    )
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    changed = 0
    total = 0
    
    for pattern in PATTERNS:
        for filepath in glob.glob(pattern, recursive=True):
            # Skip admin and API directories
            skip = False
            for skip_dir in SKIP_DIRS:
                if filepath.startswith(skip_dir):
                    skip = True
                    break
            if skip:
                continue
            
            total += 1
            if process_file(filepath):
                changed += 1
                print(f"  Modified: {filepath}")
    
    print(f"\nDone! Modified {changed}/{total} files.")

if __name__ == '__main__':
    main()
