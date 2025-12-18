#!/usr/bin/env python3
"""
Miyabi Definition Generator
Renders Jinja2 templates with YAML variables to generate complete definition files.

Usage:
    python generate.py [--output-dir generated]
"""

import argparse
import copy
import os
import sys
from pathlib import Path
from typing import Dict, Any, Iterable, List, Tuple

try:
    import yaml
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError:
    print("Error: Required packages not installed.")
    print("Please install: pip install pyyaml jinja2")
    sys.exit(1)


class MiyabiDefinitionGenerator:
    """Generator for Miyabi definition YAML files from Jinja2 templates."""

    DEFAULT_TEMPLATE_ORDER: List[str] = [
        "world_definition.yaml.j2",
        "step_back_question_method.yaml.j2",
        "entities.yaml.j2",
        "relations.yaml.j2",
        "labels.yaml.j2",
        "workflows.yaml.j2",
        "agents.yaml.j2",
        "skills.yaml.j2",
        "crates.yaml.j2",
        "universal_task_execution.yaml.j2",
        "agent_execution_maximization.yaml.j2",
    ]

    TEMPLATE_ALIASES = {
        "world": "world_definition.yaml.j2",
        "world_definition": "world_definition.yaml.j2",
        "world-definition": "world_definition.yaml.j2",
        "step_back": "step_back_question_method.yaml.j2",
        "step-back": "step_back_question_method.yaml.j2",
        "step_back_question_method": "step_back_question_method.yaml.j2",
        "entities": "entities.yaml.j2",
        "relations": "relations.yaml.j2",
        "labels": "labels.yaml.j2",
        "workflows": "workflows.yaml.j2",
        "agents": "agents.yaml.j2",
        "skills": "skills.yaml.j2",
        "crates": "crates.yaml.j2",
        "universal": "universal_task_execution.yaml.j2",
        "universal_task_execution": "universal_task_execution.yaml.j2",
        "agent_execution_maximization": "agent_execution_maximization.yaml.j2",
    }

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.variables_dir = base_dir / "variables"
        self.templates_dir = base_dir / "templates"
        self.output_dir = base_dir / "generated"

        # Load Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=select_autoescape(),
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def load_all_variables(self) -> Dict[str, Any]:
        """Load all YAML variable files from the variables directory."""
        variables = {}

        if not self.variables_dir.exists():
            print(f"Warning: Variables directory not found: {self.variables_dir}")
            return variables

        for yaml_file in self.variables_dir.glob("*.yaml"):
            print(f"Loading variables from: {yaml_file.name}")
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if data:
                    self.deep_merge_dicts(variables, data)

        return variables

    def render_template(self, template_name: str, variables: Dict[str, Any]) -> str:
        """Render a Jinja2 template with the given variables."""
        template = self.env.get_template(template_name)
        return template.render(**variables)

    @staticmethod
    def deep_merge_dicts(target: Dict[str, Any], incoming: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively merge incoming dict into target dict."""
        for key, value in incoming.items():
            if (
                key in target
                and isinstance(target[key], dict)
                and isinstance(value, dict)
            ):
                MiyabiDefinitionGenerator.deep_merge_dicts(target[key], value)
            else:
                target[key] = copy.deepcopy(value)
        return target

    def normalize_template_name(self, name: str) -> str:
        """Resolve template aliases and ensure .j2 extension."""
        if not name:
            return ""

        normalized = name.strip().lower()
        # direct alias lookup
        if normalized in self.TEMPLATE_ALIASES:
            return self.TEMPLATE_ALIASES[normalized]

        # allow filenames without .j2
        if not normalized.endswith(".j2"):
            normalized = f"{normalized}.j2"

        template_path = self.templates_dir / normalized
        if template_path.exists():
            return normalized

        return ""

    def build_template_plan(self, requested_templates: Iterable[str]) -> List[Path]:
        """Build ordered list of template Paths based on requested aliases."""
        plan: List[Path] = []
        for entry in requested_templates:
            template_name = self.normalize_template_name(entry)
            if not template_name:
                print(f"  ⚠ Unknown template alias '{entry}' – skipping")
                continue
            template_path = self.templates_dir / template_name
            if template_path not in plan:
                plan.append(template_path)
        return plan

    def load_intent_configuration(self, intent_path: Path) -> Tuple[List[Path], Dict[str, Any]]:
        """Load intent file and derive template plan + extra variables."""
        print(f"\n=== Loading Intent ===\nIntent file: {intent_path}")
        if not intent_path.exists():
            raise FileNotFoundError(f"Intent file not found: {intent_path}")

        with open(intent_path, "r", encoding="utf-8") as f:
            intent_data = yaml.safe_load(f) or {}

        if not isinstance(intent_data, dict):
            raise ValueError("Intent file must define a YAML mapping at the top level.")

        # Determine template plan
        raw_plan = intent_data.get("outputs", {}).get("templates") or intent_data.get("templates")
        if raw_plan:
            if isinstance(raw_plan, str):
                raw_plan = [raw_plan]
            elif not isinstance(raw_plan, list):
                raise ValueError("Intent 'templates' must be a list or string.")
        else:
            print("Intent did not specify templates – using default template order.")
            raw_plan = self.DEFAULT_TEMPLATE_ORDER

        template_plan = self.build_template_plan(raw_plan)
        if not template_plan:
            print("Intent template plan resolved to empty list – using default template order.")
            template_plan = [self.templates_dir / name for name in self.DEFAULT_TEMPLATE_ORDER]

        # Build variable overrides
        extra_variables: Dict[str, Any] = {"intent": intent_data}
        intent_variables = intent_data.get("variables")
        if isinstance(intent_variables, dict):
            self.deep_merge_dicts(extra_variables, intent_variables)

        print("Intent template plan:")
        for path in template_plan:
            print(f"  - {path.name}")

        return template_plan, extra_variables

    def generate_all(self, template_plan: Iterable[Path] = None, extra_variables: Dict[str, Any] = None):
        """Generate all definition files from templates."""
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Load all variables
        print("\n=== Loading Variables ===")
        variables = self.load_all_variables()

        if not variables:
            print("Error: No variables loaded. Cannot generate files.")
            return

        if extra_variables:
            print("\n=== Merging Intent Variables ===")
            self.deep_merge_dicts(variables, extra_variables)

        print(f"\nLoaded variables: {', '.join(variables.keys())}")

        # Find all template files
        print("\n=== Generating Definition Files ===")
        if template_plan:
            template_files = list(template_plan)
        else:
            template_files = list(self.templates_dir.glob("*.j2"))

        if not template_files:
            print(f"Warning: No template files found in {self.templates_dir}")
            return

        for template_file in template_files:
            # Skip base.yaml.j2 as it's only for inheritance
            if template_file.name == "base.yaml.j2":
                continue

            output_filename = template_file.stem  # Remove .j2 extension
            output_path = self.output_dir / output_filename

            print(f"\nRendering: {template_file.name}")
            print(f"  Output: {output_path}")

            try:
                rendered_content = self.render_template(template_file.name, variables)

                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(rendered_content)

                print(f"  ✓ Generated successfully ({len(rendered_content)} bytes)")

            except Exception as e:
                print(f"  ✗ Error rendering template: {e}")

        print(f"\n=== Generation Complete ===")
        print(f"Output directory: {self.output_dir}")
        print(f"Generated files: {len(list(self.output_dir.glob('*.yaml')))}")

    def list_templates(self):
        """List all available templates."""
        print("\n=== Available Templates ===")
        template_files = list(self.templates_dir.glob("*.j2"))

        for template_file in template_files:
            print(f"  - {template_file.name}")

        print(f"\nTotal: {len(template_files)} templates")

    def list_variables(self):
        """List all available variable files."""
        print("\n=== Available Variables ===")
        variable_files = list(self.variables_dir.glob("*.yaml"))

        for var_file in variable_files:
            print(f"  - {var_file.name}")

        print(f"\nTotal: {len(variable_files)} variable files")


def main():
    parser = argparse.ArgumentParser(
        description="Generate Miyabi definition YAML files from Jinja2 templates"
    )
    parser.add_argument(
        "--base-dir",
        type=Path,
        default=Path(__file__).parent,
        help="Base directory containing templates and variables (default: current directory)"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Output directory for generated files (default: base_dir/generated)"
    )
    parser.add_argument(
        "--list-templates",
        action="store_true",
        help="List all available templates"
    )
    parser.add_argument(
        "--list-variables",
        action="store_true",
        help="List all available variable files"
    )
    parser.add_argument(
        "--intent",
        type=Path,
        help="Path to intent YAML file describing project context/output plan"
    )

    args = parser.parse_args()

    # Initialize generator
    generator = MiyabiDefinitionGenerator(args.base_dir)

    if args.output_dir:
        generator.output_dir = args.output_dir

    # Execute requested action
    if args.list_templates:
        generator.list_templates()
    elif args.list_variables:
        generator.list_variables()
    else:
        print("=" * 60)
        print("Miyabi Definition Generator")
        print("=" * 60)
        template_plan = None
        extra_variables = None
        if args.intent:
            template_plan, extra_variables = generator.load_intent_configuration(args.intent)
        generator.generate_all(template_plan=template_plan, extra_variables=extra_variables)


if __name__ == "__main__":
    main()
