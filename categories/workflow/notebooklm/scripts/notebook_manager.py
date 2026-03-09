#!/usr/bin/env python3
"""
NotebookLM Notebook Manager

Manages the local library of NotebookLM notebooks.

Usage:
    python notebook_manager.py add --url URL --name NAME --description DESC --topics TOPICS
    python notebook_manager.py list
    python notebook_manager.py search --query QUERY
    python notebook_manager.py activate --id ID
    python notebook_manager.py remove --id ID
    python notebook_manager.py stats
"""

import json
import sys
import argparse
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime


class NotebookManager:
    """Manages NotebookLM notebook library."""

    def __init__(self):
        self.skill_dir = Path(__file__).parent.parent
        self.data_dir = self.skill_dir / "data"
        self.library_file = self.data_dir / "library.json"
        self.active_file = self.data_dir / "active_notebook.txt"
        self.data_dir.mkdir(exist_ok=True)

        # Initialize library if it doesn't exist
        if not self.library_file.exists():
            self.save_library({})

    def load_library(self):
        """Load notebook library."""
        with open(self.library_file, 'r') as f:
            return json.load(f)

    def save_library(self, library):
        """Save notebook library."""
        with open(self.library_file, 'w') as f:
            json.dump(library, f, indent=2)

    def extract_notebook_id(self, url):
        """Extract notebook ID from NotebookLM URL."""
        # NotebookLM URLs are like: https://notebooklm.google.com/notebook/ABC123XYZ
        path = urlparse(url).path
        parts = path.split('/notebook/')
        if len(parts) > 1:
            return parts[-1].split('/')[0]
        return None

    def add(self, url, name, description, topics):
        """Add a notebook to the library."""
        library = self.load_library()

        notebook_id = self.extract_notebook_id(url)
        if not notebook_id:
            print(f"✗ Invalid NotebookLM URL: {url}")
            return 1

        if notebook_id in library:
            print(f"✗ Notebook already exists: {notebook_id}")
            print(f"  Use 'remove' first to replace it")
            return 1

        library[notebook_id] = {
            "id": notebook_id,
            "url": url,
            "name": name,
            "description": description,
            "topics": [t.strip() for t in topics.split(',')],
            "added_at": datetime.now().isoformat()
        }

        self.save_library(library)
        print(f"✓ Added notebook: {name}")
        print(f"  ID: {notebook_id}")
        print(f"  Topics: {', '.join(library[notebook_id]['topics'])}")
        return 0

    def list(self):
        """List all notebooks in the library."""
        library = self.load_library()

        if not library:
            print("No notebooks in library")
            print("\nAdd a notebook with:")
            print("  python scripts/run.py notebook_manager.py add --url URL --name NAME --description DESC --topics TOPICS")
            return 0

        # Get active notebook
        active_id = None
        if self.active_file.exists():
            with open(self.active_file, 'r') as f:
                active_id = f.read().strip()

        print(f"Notebooks ({len(library)}):")
        print("=" * 60)

        for notebook_id, notebook in library.items():
            active_marker = " (active)" if notebook_id == active_id else ""
            print(f"\n[{notebook_id}]{active_marker}")
            print(f"  Name: {notebook['name']}")
            print(f"  Description: {notebook['description']}")
            print(f"  Topics: {', '.join(notebook['topics'])}")
            print(f"  URL: {notebook['url']}")

        return 0

    def search(self, query):
        """Search notebooks by topic or name."""
        library = self.load_library()
        query = query.lower()

        results = []
        for notebook_id, notebook in library.items():
            # Search in name, description, and topics
            if (query in notebook['name'].lower() or
                query in notebook['description'].lower() or
                any(query in topic.lower() for topic in notebook['topics'])):
                results.append((notebook_id, notebook))

        if not results:
            print(f"No results for: {query}")
            return 0

        print(f"Results for '{query}' ({len(results)} found):")
        print("=" * 60)

        for notebook_id, notebook in results:
            print(f"\n[{notebook_id}]")
            print(f"  Name: {notebook['name']}")
            print(f"  Topics: {', '.join(notebook['topics'])}")

        return 0

    def activate(self, notebook_id):
        """Set a notebook as active."""
        library = self.load_library()

        if notebook_id not in library:
            print(f"✗ Notebook not found: {notebook_id}")
            return 1

        with open(self.active_file, 'w') as f:
            f.write(notebook_id)

        notebook = library[notebook_id]
        print(f"✓ Active notebook set to: {notebook['name']}")
        return 0

    def remove(self, notebook_id):
        """Remove a notebook from the library."""
        library = self.load_library()

        if notebook_id not in library:
            print(f"✗ Notebook not found: {notebook_id}")
            return 1

        name = library[notebook_id]['name']
        del library[notebook_id]
        self.save_library(library)

        print(f"✓ Removed notebook: {name}")

        # Clear active file if this was the active notebook
        if self.active_file.exists():
            with open(self.active_file, 'r') as f:
                active_id = f.read().strip()
            if active_id == notebook_id:
                self.active_file.unlink()

        return 0

    def stats(self):
        """Show library statistics."""
        library = self.load_library()

        total = len(library)
        if total == 0:
            print("No notebooks in library")
            return 0

        # Count topics
        all_topics = []
        for notebook in library.values():
            all_topics.extend(notebook['topics'])

        from collections import Counter
        topic_counts = Counter(all_topics)

        print(f"Library Statistics:")
        print("=" * 40)
        print(f"Total notebooks: {total}")
        print(f"\nTop topics:")
        for topic, count in topic_counts.most_common(10):
            print(f"  {topic}: {count}")

        return 0


def main():
    """Main entry point."""
    manager = NotebookManager()

    parser = argparse.ArgumentParser(description="Manage NotebookLM notebook library")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Add command
    add_parser = subparsers.add_parser('add', help='Add a notebook')
    add_parser.add_argument('--url', required=True, help='NotebookLM URL')
    add_parser.add_argument('--name', required=True, help='Notebook name')
    add_parser.add_argument('--description', required=True, help='Notebook description')
    add_parser.add_argument('--topics', required=True, help='Comma-separated topics')

    # List command
    subparsers.add_parser('list', help='List all notebooks')

    # Search command
    search_parser = subparsers.add_parser('search', help='Search notebooks')
    search_parser.add_argument('--query', required=True, help='Search query')

    # Activate command
    activate_parser = subparsers.add_parser('activate', help='Set active notebook')
    activate_parser.add_argument('--id', required=True, help='Notebook ID')

    # Remove command
    remove_parser = subparsers.add_parser('remove', help='Remove a notebook')
    remove_parser.add_argument('--id', required=True, help='Notebook ID')

    # Stats command
    subparsers.add_parser('stats', help='Show library statistics')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    if args.command == 'add':
        return manager.add(args.url, args.name, args.description, args.topics)
    elif args.command == 'list':
        return manager.list()
    elif args.command == 'search':
        return manager.search(args.query)
    elif args.command == 'activate':
        return manager.activate(args.id)
    elif args.command == 'remove':
        return manager.remove(args.id)
    elif args.command == 'stats':
        return manager.stats()
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
