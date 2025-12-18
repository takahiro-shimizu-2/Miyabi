# Miyabi PlantUML Diagrams

Auto-generated PlantUML diagrams from Miyabi YAML definitions.

## Generated Diagrams

### 1. Entity-Relation Model (`entities.puml`)

Visualizes the 14 core entities in Miyabi and their 27+ relationships:

- **Entities**: Issue, Task, Agent, PR, Label, QualityReport, Command, Escalation, Deployment, LDDLog, DAG, Worktree, DiscordCommunity, SubIssue
- **Relations**: Hierarchical dependencies, workflow associations, execution flows

**View**: Open in PlantUML viewer or use online renderer at [plantuml.com](http://www.plantuml.com/plantuml/uml/)

### 2. Agent Architecture (`agents.puml`)

Shows the 21 agents organized by function:

**Coding Agents (7)**:
- CoordinatorAgent, CodeGenAgent, ReviewAgent, IssueAgent, PRAgent, DeploymentAgent, RefresherAgent

**Business Agents (14)** grouped by category:
- Strategy & Planning (6)
- Marketing & Content (5)
- Sales & CRM (3)

### 3. Workflow Sequence (`workflow.puml`)

Sequence diagram showing typical task execution flow:
1. User creates Issue
2. CoordinatorAgent analyzes and plans
3. CodeGenAgent implements
4. ReviewAgent checks quality
5. PRAgent creates Pull Request

## Usage

### Command Line

```bash
# Generate all diagrams
python3 ../generate_puml.py

# Specify output directory
python3 ../generate_puml.py --output-dir custom_diagrams/
```

### View Diagrams

**Option 1: VS Code**
- Install "PlantUML" extension
- Open `.puml` file
- Press `Alt+D` to preview

**Option 2: Online**
- Copy diagram content
- Paste at http://www.plantuml.com/plantuml/uml/

**Option 3: Command Line**
```bash
# Install PlantUML (requires Java)
brew install plantuml  # macOS
apt-get install plantuml  # Linux

# Generate PNG
plantuml entities.puml

# Generate SVG
plantuml -tsvg entities.puml
```

## Regeneration

Diagrams are auto-generated from `/generated/*.yaml` files. To regenerate:

1. Update variables in `/variables/*.yaml`
2. Regenerate YAML: `python3 ../generate.py`
3. Regenerate diagrams: `python3 ../generate_puml.py`

## Files

```
diagrams/
├── README.md          # This file
├── entities.puml      # Entity-Relation diagram (14 entities)
├── agents.puml        # Agent architecture (21 agents)
└── workflow.puml      # Workflow sequence diagram
```

## Integration

These diagrams can be embedded in documentation:

**Markdown**:
```markdown
![Miyabi Entities](http://www.plantuml.com/plantuml/proxy?src=https://raw.githubusercontent.com/ShunsukeHayashi/Miyabi/main/miyabi_def/diagrams/entities.puml)
```

**HTML**:
```html
<img src="http://www.plantuml.com/plantuml/svg/~1UDfg4S0000" alt="Miyabi Architecture">
```

## Notes

- Diagrams are version-controlled
- Auto-generated from canonical YAML definitions
- Kept in sync with codebase via `generate_puml.py`
- Used in project documentation and presentations

---

**Generated**: 2025-11-01
**Tool**: `miyabi_def/generate_puml.py`
**Source**: `miyabi_def/generated/*.yaml`
