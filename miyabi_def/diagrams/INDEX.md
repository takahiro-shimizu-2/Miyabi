# miyabi_def PlantUML Diagrams - Index

**Version**: 1.0.0
**Created**: 2025-11-04
**Author**: Miyabi Team
**Total Diagrams**: 9 (6 refined + 3 legacy)

---

## 🎨 Refined Diagrams (Recommended)

### 1. System Architecture (Refined) ⭐

**File**: `system_architecture_refined.puml`
**Theme**: Cerulean Outline
**Size**: Large
**Complexity**: Medium

**Description**: Complete architecture with professional academic color palette. Shows data flow from variable sources through Jinja2 templates to generated YAML files.

**Color Palette**:
- 🔵 Blue (#3B82F6): Variable loading
- 🟢 Green (#10B981): Template processing
- 🟣 Purple (#6366F1): Template inheritance
- 🟣 Violet (#8B5CF6): YAML generation
- 🔴 Red (#DC2626): Consumption

**Key Features**:
- 15 variable sources
- Jinja2 template engine
- 11 generated YAML files (191KB)
- 3 consumption layers

---

### 2. SWML Mathematical Structure

**File**: `swml_mathematical_structure.puml`
**Theme**: Blueprint
**Size**: Extra Large
**Complexity**: High

**Description**: Complete mathematical foundation of SWML including Ω function, six-phase decomposition, task algebra, optimization theory, and learning.

**Components**:
- **Fundamental Spaces**: 𝒲, ℐ, ℛ, 𝒯 (4 spaces)
- **Ω Function**: Central execution engine
- **Six Phases**: θ₁ → θ₂ → θ₃ → θ₄ → θ₅ → θ₆
- **Task Algebra**: ∘, ⊗, ⊕, *
- **Optimization**: Lagrangian, KKT, Bellman
- **Learning**: Knowledge update, pattern extraction

**Mathematical Formulas**:
- Ω(I, W) = ∫_{t₀}^{t₁} 𝔼(I(τ), W(τ)) dτ
- Q(R) = ω₁·C(R) + ω₂·A(R) + ω₃·E(R)
- V*(I, W) = max_{a} [r(I,W,a) + γV*(I',W')]

---

### 3. Execution Category (Simplified) ⭐

**File**: `execution_category_simple.puml`
**Theme**: Blueprint
**Size**: Large
**Complexity**: Medium-High

**Description**: Category-theoretic structure using class diagrams for clarity. Shows objects, morphisms, functors, natural transformations, and Rust implementation.

**Components**:
- **Execution Category 𝓔**: 8 objects, 6 morphisms
- **Monoid Structure**: (𝔼, ∘, id)
- **Functor**: F_W: 𝓔 → 𝓔
- **Natural Transformations**: η, ε
- **Task Algebra**: Operations and laws
- **DAG Structure**: Graph representation
- **Theorems**: Composability, preservation, Yoneda
- **Rust Traits**: Category, Functor, WorldState

---

### 4. Data Flow Pipeline

**File**: `data_flow_pipeline.puml`
**Theme**: Blueprint
**Size**: Extra Large
**Complexity**: High

**Description**: End-to-end pipeline from variable loading through SWML execution to final outputs. Shows all 5 phases of processing.

**Phases**:
1. **Variable Loading** (Yellow): Load 15 YAML files
2. **Template Processing** (Green): Jinja2 rendering
3. **YAML Generation** (Cyan): Write 11 files (191KB)
4. **Consumption & Execution** (Pink): SWML six-phase pipeline
5. **Documentation & CI/CD** (Lavender): Outputs

**Performance Metrics**:
- Generation Time: ~500ms
- Total Size: 191KB
- Entities: 14
- Relations: 39
- Labels: 57
- Workflows: 5 (38 stages)
- Agents: 21
- Crates: 15
- Skills: 18

---

### 5. Generation Sequence

**File**: `generation_sequence.puml`
**Theme**: Blueprint
**Size**: Medium
**Complexity**: Medium

**Description**: Detailed sequence diagram showing step-by-step YAML generation process from script invocation to completion.

**Actors**:
- Developer
- generate.py
- MiyabiDefinitionGenerator
- Jinja2 Environment
- Variable files (15)
- Template files (11)
- Output files (11)

**Phases**:
1. Initialization (setup generator + Jinja2)
2. Load Variables (all 15 files)
3. Process Templates (render 11 templates)
4. Summary (print statistics)

---

### 6. World Space 5D Structure

**File**: `world_space_5d.puml`
**Theme**: Blueprint
**Size**: Extra Large
**Complexity**: High

**Description**: Visualization of the five-dimensional World Space (𝒲) with detailed component breakdown.

**Five Dimensions**:
1. **Temporal (t)**: Time, horizon, constraints
2. **Spatial (s)**: Physical × Digital × Abstract
3. **Contextual (c)**: Domain × User × System
4. **Resources (r)**: Compute × Human × Info × Financial
5. **Environmental (e)**: Load × Deps × Constraints × External

**Mathematical Integration**:
- W(t) = ⟨t, s, c, r, e⟩
- ∂W/∂t = F(W, I, ∇W)
- Ψ(W) = ∫[t₀→t₁] ∇(s, c, r, e) dt
- Ω Function: Uses specific dimensions per phase

---

## 📊 Legacy Diagrams (Reference)

### 7. Entities (Legacy)

**File**: `entities.puml`
**Description**: Original entity-relation model visualization

---

### 8. Agents (Legacy)

**File**: `agents.puml`
**Description**: Original agent architecture diagram

---

### 9. Workflow (Legacy)

**File**: `workflow.puml`
**Description**: Original workflow sequence diagram

---

## 🎨 Color Palettes

### Academic Palette (Refined Diagrams)

**Primary Colors**:
- 🔵 **Blue** (#3B82F6): Data flow, variables
- 🟢 **Green** (#10B981): Processing, templates
- 🟣 **Purple** (#6366F1): Inheritance
- 🟣 **Violet** (#8B5CF6): Generation
- 🔴 **Red** (#DC2626): Consumption, deployment

**Background Colors**:
- **White** (#FFFFFF): Clean background
- **Light Blue** (#F8FAFB): Package backgrounds
- **Pale Yellow** (#FEF3C7): Engine components
- **Pale Green** (#ECFDF5): Templates
- **Pale Purple** (#FDF4FF): Generated files
- **Pale Red** (#FEE2E2): Consumption layer

---

## 📐 Diagram Relationships

```
System Architecture (Refined) ⭐
    │
    ├─→ Data Flow Pipeline (detailed view)
    │   └─→ Generation Sequence (step-by-step)
    │
    ├─→ SWML Mathematical Structure
    │   ├─→ Execution Category (Simplified) ⭐
    │   └─→ World Space 5D Structure
    │
    └─→ Legacy Diagrams (reference only)
        ├─→ Entities
        ├─→ Agents
        └─→ Workflow
```

---

## 🚀 Usage Guide

### Rendering Diagrams

**Command Line** (requires PlantUML):
```bash
cd /Users/shunsuke/Dev/miyabi-private/miyabi_def/diagrams

# Render all refined diagrams
plantuml system_architecture_refined.puml \
         swml_mathematical_structure.puml \
         execution_category_simple.puml \
         data_flow_pipeline.puml \
         generation_sequence.puml \
         world_space_5d.puml

# Output to SVG (better quality)
plantuml -tsvg *.puml

# Output to PNG (web-friendly)
plantuml -tpng *.puml
```

**VSCode Extension**:
```
1. Install "PlantUML" extension (jebbs)
2. Open any .puml file
3. Press Alt+D (Win/Linux) or Option+D (Mac)
4. Preview appears in side panel
```

**Online Renderer**:
```
1. Copy diagram content
2. Visit: http://www.plantuml.com/plantuml/uml/
3. Paste and view
```

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Total Diagrams** | 9 |
| **Refined Diagrams** | 6 |
| **Legacy Diagrams** | 3 |
| **Total Size** | ~15KB (source .puml) |
| **Average Complexity** | Medium-High |
| **Themes** | 2 (Blueprint, Cerulean) |
| **Variable Files** | 15 |
| **Template Files** | 11 |
| **Generated Files** | 11 (191KB) |

---

## 🔧 Maintenance

### Adding New Diagrams

1. Create new `.puml` file
2. Use recommended theme: `!theme cerulean-outline` or `!theme blueprint`
3. Follow color palette guidelines
4. Add documentation to this INDEX.md
5. Test rendering locally
6. Update diagram count

### Updating Existing Diagrams

1. Modify `.puml` file
2. Test rendering
3. Update INDEX.md if structure changed
4. Regenerate images
5. Commit changes

---

## 📚 Best Practices

1. **Theme Consistency**: Use `cerulean-outline` for new diagrams
2. **Color Palette**: Follow academic palette (blue, green, purple, red)
3. **Font**: Use "SF Pro Display" or system default
4. **Shadowing**: Disable for cleaner look
5. **Notes**: Add explanatory notes for complex sections
6. **Legends**: Always include legend for symbols
7. **Mathematical Notation**: Use Unicode symbols consistently
8. **File Size**: Keep diagrams focused (< 20KB source)
9. **Naming**: Use descriptive, lowercase filenames with underscores
10. **Documentation**: Always update INDEX.md

---

## 🔗 References

- **SWML Paper**: `../SWML_PAPER.pdf`
- **Variables**: `../variables/`
- **Templates**: `../templates/`
- **Generated**: `../generated/`
- **Main README**: `../README.md`

---

## 📝 Version History

- **1.0.0** (2025-11-04): Initial comprehensive diagram set
  - 6 refined diagrams with academic color palette
  - 3 legacy diagrams for reference
  - Complete INDEX.md documentation

---

**Maintained by**: Miyabi Team
**License**: Apache-2.0
**Contact**: https://github.com/ShunsukeHayashi/Miyabi
