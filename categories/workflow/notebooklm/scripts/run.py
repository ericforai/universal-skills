#!/usr/bin/env python3
"""
NotebookLM Skill - Run Wrapper

This wrapper handles virtual environment setup and executes scripts.
Always use this wrapper instead of calling scripts directly.

Usage: python scripts/run.py <script_name> [args...]

Example:
    python scripts/run.py auth_manager.py status
    python scripts/run.py notebook_manager.py list
    python scripts/run.py ask_question.py --question "What is...?"
"""

import os
import sys
import subprocess
from pathlib import Path


class RunWrapper:
    """Handles environment setup and script execution."""

    def __init__(self):
        self.skill_dir = Path(__file__).parent.parent
        self.venv_dir = self.skill_dir / ".venv"
        self.scripts_dir = self.skill_dir / "scripts"
        self.data_dir = self.skill_dir / "data"

        # Ensure data directory exists
        self.data_dir.mkdir(exist_ok=True)

    def setup_venv(self):
        """Create virtual environment if it doesn't exist."""
        if not self.venv_dir.exists():
            print("Creating virtual environment...")
            subprocess.run(
                [sys.executable, "-m", "venv", str(self.venv_dir)],
                check=True
            )
            print("Virtual environment created.")

    def get_python(self):
        """Get the Python executable in the virtual environment."""
        if sys.platform == "win32":
            return self.venv_dir / "Scripts" / "python.exe"
        return self.venv_dir / "bin" / "python"

    def install_dependencies(self):
        """Install required dependencies."""
        requirements_file = self.skill_dir / "requirements.txt"
        if requirements_file.exists():
            print("Installing dependencies...")
            subprocess.run(
                [str(self.get_python()), "-m", "pip", "install", "-r", str(requirements_file)],
                check=True
            )
            print("Dependencies installed.")

    def find_script(self, script_name):
        """Find the script to execute."""
        # Add .py extension if not present
        if not script_name.endswith(".py"):
            script_name += ".py"

        script_path = self.scripts_dir / script_name
        if script_path.exists():
            return script_path

        # Try in scripts subdirectory
        for subdir in self.scripts_dir.iterdir():
            if subdir.is_dir():
                script_path = subdir / script_name
                if script_path.exists():
                    return script_path

        raise FileNotFoundError(f"Script not found: {script_name}")

    def run(self, script_name, args):
        """Execute the specified script with the given arguments."""
        self.setup_venv()
        self.install_dependencies()

        script_path = self.find_script(script_name)

        # Build command with the script path and arguments
        cmd = [str(self.get_python()), str(script_path)] + args

        # Execute the script
        subprocess.run(cmd, check=True)


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python scripts/run.py <script_name> [args...]")
        print("\nAvailable scripts:")
        print("  auth_manager.py        - Manage Google authentication")
        print("  notebook_manager.py    - Manage NotebookLM library")
        print("  ask_question.py        - Query a notebook")
        print("  cleanup_manager.py     - Clean up data and browser state")
        sys.exit(1)

    wrapper = RunWrapper()
    script_name = sys.argv[1]
    args = sys.argv[2:]

    try:
        wrapper.run(script_name, args)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
