#!/usr/bin/env python3
"""
NotebookLM Cleanup Manager

Cleans up temporary data and browser state.

Usage:
    python cleanup_manager.py                    # Preview cleanup
    python cleanup_manager.py --confirm          # Execute cleanup
    python cleanup_manager.py --preserve-library # Keep notebooks
"""

import sys
import shutil
import argparse
from pathlib import Path


class CleanupManager:
    """Manages cleanup of temporary data."""

    def __init__(self):
        self.skill_dir = Path(__file__).parent.parent
        self.data_dir = self.skill_dir / "data"
        self.browser_state_dir = self.data_dir / "browser_state"
        self.library_file = self.data_dir / "library.json"
        self.active_file = self.data_dir / "active_notebook.txt"

    def get_size(self, path):
        """Get size of a directory in bytes."""
        if not path.exists():
            return 0
        total = 0
        for item in path.rglob('*'):
            if item.is_file():
                total += item.stat().st_size
        return total

    def format_size(self, bytes_size):
        """Format bytes to human-readable size."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_size < 1024.0:
                return f"{bytes_size:.1f} {unit}"
            bytes_size /= 1024.0
        return f"{bytes_size:.1f} TB"

    def preview(self, preserve_library=True):
        """Preview what would be cleaned."""
        print("Cleanup Preview:")
        print("=" * 60)

        # Browser state
        browser_size = self.get_size(self.browser_state_dir)
        print(f"\nBrowser state: {self.format_size(browser_size)}")
        print(f"  {self.browser_state_dir}")

        # Cache files
        cache_files = list(self.data_dir.glob("*.cache"))
        cache_size = sum(f.stat().st_size for f in cache_files)
        print(f"\nCache files: {self.format_size(cache_size)}")
        for f in cache_files:
            print(f"  {f.name}")

        # Total
        total = browser_size + cache_size
        print(f"\nTotal to clean: {self.format_size(total)}")

        if preserve_library:
            print("\n✓ Notebook library will be preserved")
        else:
            print("\n⚠ Notebook library will be removed")

        return 0

    def cleanup(self, confirm=False, preserve_library=True):
        """Execute cleanup."""
        if not confirm:
            return self.preview(preserve_library)

        print("Cleaning up...")

        # Clean browser state
        if self.browser_state_dir.exists():
            size = self.get_size(self.browser_state_dir)
            shutil.rmtree(self.browser_state_dir)
            print(f"✓ Removed browser state ({self.format_size(size)})")

        # Clean cache files
        cache_files = list(self.data_dir.glob("*.cache"))
        for f in cache_files:
            f.unlink()
        print(f"✓ Removed {len(cache_files)} cache files")

        # Optionally remove library
        if not preserve_library:
            if self.library_file.exists():
                self.library_file.unlink()
                print("✓ Removed notebook library")
            if self.active_file.exists():
                self.active_file.unlink()
                print("✓ Cleared active notebook")

        print("\nCleanup complete!")
        return 0


def main():
    """Main entry point."""
    manager = CleanupManager()

    parser = argparse.ArgumentParser(description="Clean up NotebookLM data")
    parser.add_argument('--confirm', action='store_true',
                       help='Actually perform cleanup (without this, only preview)')
    parser.add_argument('--preserve-library', action='store_true', default=True,
                       help='Keep notebook library (default: True)')

    args = parser.parse_args()

    return manager.cleanup(confirm=args.confirm, preserve_library=args.preserve_library)


if __name__ == "__main__":
    sys.exit(main())
