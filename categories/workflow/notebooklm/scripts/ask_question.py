#!/usr/bin/env python3
"""
NotebookLM Question Asker

Ask questions to a specific NotebookLM notebook.

Usage:
    python ask_question.py --question "What is...?"
    python ask_question.py --question "..." --notebook-id ID
    python ask_question.py --question "..." --notebook-url URL
    python ask_question.py --question "..." --show-browser
"""

import sys
import argparse
from pathlib import Path


class QuestionAsker:
    """Asks questions to NotebookLM notebooks."""

    def __init__(self):
        self.skill_dir = Path(__file__).parent.parent
        self.data_dir = self.skill_dir / "data"
        self.library_file = self.data_dir / "library.json"
        self.active_file = self.data_dir / "active_notebook.txt"

    def get_notebook_url(self, notebook_id=None, notebook_url=None):
        """Get the notebook URL to query."""
        # Direct URL takes precedence
        if notebook_url:
            return notebook_url

        # Load library if notebook_id is specified
        if notebook_id:
            return self._get_url_from_library(notebook_id)

        # Try to use active notebook
        if self.active_file.exists():
            with open(self.active_file, 'r') as f:
                active_id = f.read().strip()
            if active_id:
                return self._get_url_from_library(active_id)

        return None

    def _get_url_from_library(self, notebook_id):
        """Get URL from library by notebook ID."""
        if not self.library_file.exists():
            print("✗ No notebook library found")
            return None

        import json
        with open(self.library_file, 'r') as f:
            library = json.load(f)

        if notebook_id not in library:
            print(f"✗ Notebook not found: {notebook_id}")
            return None

        return library[notebook_id]['url']

    def ask(self, question, notebook_id=None, notebook_url=None, show_browser=False):
        """Ask a question to a NotebookLM notebook."""
        url = self.get_notebook_url(notebook_id, notebook_url)

        if not url:
            print("✗ No notebook specified")
            print("\nOptions:")
            print("  1. Set active notebook: python scripts/run.py notebook_manager.py activate --id ID")
            print("  2. Specify notebook: --notebook-id ID or --notebook-url URL")
            return 1

        print(f"Asking: {question}")
        print(f"Notebook: {url}")
        print("-" * 60)

        # For a real implementation, this would:
        # 1. Open browser to the NotebookLM URL
        # 2. Type the question in the query box
        # 3. Wait for the answer
        # 4. Extract and display the answer

        print("\n⚠ Browser automation requires additional setup.")
        print("\nTo ask this question:")
        print(f"1. Open {url}")
        print(f"2. Type: {question}")
        print("3. Copy the answer back here")

        # Simulated response for demonstration
        print("\n--- Answer ---")
        print("(In production, this would contain the actual NotebookLM answer)")
        print("\nEXTREMELY IMPORTANT: Is that ALL you need to know?")
        print("-" * 60)

        return 0


def main():
    """Main entry point."""
    asker = QuestionAsker()

    parser = argparse.ArgumentParser(description="Ask questions to NotebookLM")
    parser.add_argument('--question', '-q', required=True, help='Question to ask')
    parser.add_argument('--notebook-id', '-i', help='Notebook ID from library')
    parser.add_argument('--notebook-url', '-u', help='Direct NotebookLM URL')
    parser.add_argument('--show-browser', action='store_true', help='Show browser window')

    args = parser.parse_args()

    return asker.ask(
        question=args.question,
        notebook_id=args.notebook_id,
        notebook_url=args.notebook_url,
        show_browser=args.show_browser
    )


if __name__ == "__main__":
    sys.exit(main())
