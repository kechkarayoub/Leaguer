#!/usr/bin/env python3
"""
Script to check for missing keys/sub-keys across locale files in different languages.
Compares each file with its equivalent in other languages and reports missing keys.
"""

import json
import os
from pathlib import Path
from collections import defaultdict

def get_all_keys(obj, prefix=""):
    """
    Recursively extract all keys from a nested JSON object.
    
    Args:
        obj: The JSON object (dict, list, or primitive value)
        prefix: Current path prefix for nested keys
        
    Returns:
        Set of all key paths in dot notation (e.g., "login.title", "resetPassword.button")
    """
    keys = set()
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            current_path = f"{prefix}.{key}" if prefix else key
            keys.add(current_path)
            
            # Recursively get keys from nested objects
            if isinstance(value, (dict, list)):
                keys.update(get_all_keys(value, current_path))
    
    elif isinstance(obj, list):
        # For lists, check each item (though locale files typically don't have arrays)
        for i, item in enumerate(obj):
            if isinstance(item, (dict, list)):
                keys.update(get_all_keys(item, f"{prefix}[{i}]"))
    
    return keys

def load_locale_file(file_path):
    """
    Load and parse a locale JSON file.
    
    Args:
        file_path: Path to the JSON file
        
    Returns:
        Tuple of (parsed_data, all_keys_set) or (None, None) if error
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        keys = get_all_keys(data)
        return data, keys
    except Exception as e:
        print(f"Error loading {file_path}: {str(e)}")
        return None, None

def compare_locale_files():
    """
    Compare all locale files and identify missing keys.
    """
    # Define the base locales directory
    locales_dir = Path("frontend/web/public/locales")
    
    # Check if directory exists
    if not locales_dir.exists():
        print(f"Error: Directory {locales_dir} does not exist!")
        return
    
    # Get all languages
    languages = [d.name for d in locales_dir.iterdir() if d.is_dir()]
    if not languages:
        print("No language directories found!")
        return
    
    print(f"Found languages: {', '.join(languages)}")
    print("=" * 80)
    
    # Get all unique file names across all languages
    all_files = set()
    for lang in languages:
        lang_dir = locales_dir / lang
        for json_file in lang_dir.glob("*.json"):
            all_files.add(json_file.name)
    
    # Process each file type
    for filename in sorted(all_files):
        print(f"\n📁 Analyzing file: {filename}")
        print("-" * 60)
        
        # Load data from all languages for this file
        file_data = {}
        all_keys_per_lang = {}
        
        for lang in languages:
            file_path = locales_dir / lang / filename
            if file_path.exists():
                data, keys = load_locale_file(file_path)
                if data is not None:
                    file_data[lang] = data
                    all_keys_per_lang[lang] = keys
        
        if not file_data:
            print(f"  ⚠️  No valid files found for {filename}")
            continue
        
        # Find the union of all keys (master key set)
        all_possible_keys = set()
        for keys in all_keys_per_lang.values():
            all_possible_keys.update(keys)
        
        print(f"  📊 Total unique keys found: {len(all_possible_keys)}")
        print(f"  🌍 Languages with this file: {', '.join(sorted(file_data.keys()))}")
        
        # Check for missing keys in each language
        missing_found = False
        
        for lang in sorted(file_data.keys()):
            lang_keys = all_keys_per_lang[lang]
            missing_keys = all_possible_keys - lang_keys
            
            if missing_keys:
                missing_found = True
                print(f"\n  🔍 Language: {lang.upper()}")
                print(f"     📈 Has {len(lang_keys)}/{len(all_possible_keys)} keys")
                print(f"     ❌ Missing {len(missing_keys)} keys:")
                
                # Group missing keys by their root section for better readability
                missing_by_section = defaultdict(list)
                for key in sorted(missing_keys):
                    root = key.split('.')[0]
                    missing_by_section[root].append(key)
                
                for section, keys in sorted(missing_by_section.items()):
                    print(f"        📋 {section}:")
                    for key in keys:
                        print(f"           • {key}")
        
        if not missing_found:
            print(f"  ✅ All languages have consistent keys for {filename}")
        
        # Show which languages are missing this entire file
        missing_file_langs = set(languages) - set(file_data.keys())
        if missing_file_langs:
            print(f"\n  ⚠️  File {filename} is missing in languages: {', '.join(sorted(missing_file_langs))}")

def generate_missing_keys_report():
    """
    Generate a detailed report of missing keys for each file and language.
    """
    locales_dir = Path("frontend/web/public/locales")
    
    if not locales_dir.exists():
        print(f"Error: Directory {locales_dir} does not exist!")
        return
    
    languages = [d.name for d in locales_dir.iterdir() if d.is_dir()]
    all_files = set()
    
    for lang in languages:
        lang_dir = locales_dir / lang
        for json_file in lang_dir.glob("*.json"):
            all_files.add(json_file.name)
    
    # Create a comprehensive report
    report = []
    report.append("# Missing Keys Report")
    report.append("=" * 50)
    report.append(f"Generated for languages: {', '.join(sorted(languages))}")
    report.append(f"Files analyzed: {', '.join(sorted(all_files))}")
    report.append("")
    
    total_missing = 0
    
    for filename in sorted(all_files):
        file_data = {}
        all_keys_per_lang = {}
        
        for lang in languages:
            file_path = locales_dir / lang / filename
            if file_path.exists():
                data, keys = load_locale_file(file_path)
                if data is not None:
                    file_data[lang] = data
                    all_keys_per_lang[lang] = keys
        
        if not file_data:
            continue
        
        all_possible_keys = set()
        for keys in all_keys_per_lang.values():
            all_possible_keys.update(keys)
        
        report.append(f"## File: {filename}")
        report.append(f"Total keys: {len(all_possible_keys)}")
        report.append("")
        
        file_has_missing = False
        
        for lang in sorted(file_data.keys()):
            lang_keys = all_keys_per_lang[lang]
            missing_keys = all_possible_keys - lang_keys
            
            if missing_keys:
                file_has_missing = True
                total_missing += len(missing_keys)
                report.append(f"### {lang.upper()} - Missing {len(missing_keys)} keys:")
                
                missing_by_section = defaultdict(list)
                for key in sorted(missing_keys):
                    root = key.split('.')[0]
                    missing_by_section[root].append(key)
                
                for section, keys in sorted(missing_by_section.items()):
                    report.append(f"**{section}:**")
                    for key in keys:
                        report.append(f"  - {key}")
                report.append("")
        
        if not file_has_missing:
            report.append("✅ All languages have consistent keys")
            report.append("")
        
        # Check for missing files
        missing_file_langs = set(languages) - set(file_data.keys())
        if missing_file_langs:
            report.append(f"⚠️ File missing in: {', '.join(sorted(missing_file_langs))}")
            report.append("")
    
    report.append(f"\n## Summary")
    report.append(f"Total missing keys across all files: {total_missing}")
    
    # Save report to file
    report_file = "locale_missing_keys_report.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    
    print(f"\n📄 Detailed report saved to: {report_file}")

def main():
    """Main function to check for missing keys across locale files."""
    print("🔍 Checking for missing keys/sub-keys across locale files...")
    print("=" * 80)
    
    compare_locale_files()
    
    print("\n" + "=" * 80)
    print("✅ Analysis complete!")
    
    # Ask if user wants a detailed report
    print("\n📄 Generating detailed markdown report...")
    generate_missing_keys_report()

if __name__ == "__main__":
    main()
