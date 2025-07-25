#!/usr/bin/env python3
"""
Script to sort JSON keys alphabetically in all locale files.
Sorts both top-level keys and nested object keys recursively.
"""

import json
import os
from pathlib import Path
from collections import OrderedDict

def sort_json_keys(obj):
    """
    Recursively sort all keys in a JSON object alphabetically.
    
    Args:
        obj: The JSON object (dict, list, or primitive value)
        
    Returns:
        The object with all keys sorted alphabetically
    """
    if isinstance(obj, dict):
        # Sort the keys alphabetically and recursively sort nested objects
        sorted_dict = {}
        for key in sorted(obj.keys()):
            sorted_dict[key] = sort_json_keys(obj[key])
        return sorted_dict
    elif isinstance(obj, list):
        # For lists, sort each item if it's a dict
        return [sort_json_keys(item) for item in obj]
    else:
        # For primitive values (str, int, bool, null), return as-is
        return obj

def sort_locale_file(file_path):
    """
    Sort keys in a single locale JSON file.
    
    Args:
        file_path: Path to the JSON file
    """
    try:
        print(f"Sorting keys in: {file_path}")
        
        # Read the JSON file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Sort all keys recursively
        sorted_data = sort_json_keys(data)
        
        # Write back to file with proper formatting
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(sorted_data, f, indent=2, ensure_ascii=False, separators=(',', ': '))
        
        print(f"✓ Successfully sorted: {file_path}")
        
    except Exception as e:
        print(f"✗ Error processing {file_path}: {str(e)}")

def main():
    """Main function to sort all locale files."""
    # Define the base locales directory
    locales_dir = Path("frontend/web/public/locales")
    
    # Check if directory exists
    if not locales_dir.exists():
        print(f"Error: Directory {locales_dir} does not exist!")
        return
    
    print("Starting to sort JSON keys in all locale files...")
    print("=" * 60)
    
    # Process each language directory
    for lang_dir in locales_dir.iterdir():
        if lang_dir.is_dir():
            print(f"\nProcessing language: {lang_dir.name}")
            print("-" * 30)
            
            # Process each JSON file in the language directory
            for json_file in lang_dir.glob("*.json"):
                sort_locale_file(json_file)
    
    print("\n" + "=" * 60)
    print("Finished sorting all locale files!")

if __name__ == "__main__":
    main()
