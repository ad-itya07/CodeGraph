# 9. Health Index

## What Question Does This Answer?

> **"How structurally healthy is this codebase, as measurable from its static dependency graph?"**

More specifically: *"Do the files and symbols in this repository exhibit structural patterns — such as circular dependencies, excessive coupling, or high connectivity concentration — that are known to increase architectural risk?"*

The Health Index is CodeGraph's primary top-level summary of a repository's structural condition. It distills six independent structural metrics into a single number on a 0–100 scale, where higher is healthier.

It does **not** answer:

- Is the business logic correct?
- Is the test coverage sufficient?
- Is the code well-named or readable?
- Are there performance issues?
- Are there security vulnerabilities?

Those questions require analysis that goes beyond what CodeGraph's static graph model represents. The Health Index is strictly a **structural signal**, derived entirely from the graph's nodes and edges.

---

## Location

```
server/src/analytics/health/
├── CalculateHealthIndex.ts        ← Final aggregator
├── cycles/
│   └── calculateCycleHealth.ts
├── coupling/
│   └── calculateCouplingHealth.ts
├── fan-out/
│   └── calculateFanOutHealth.ts
├── fan-in/
│   └── calculateFanInHealth.ts
├── dependency/
│   └── calculateDependencyHealth.ts
└── modules/
    └── calculateModuleHealth.ts
```

---

## The Six Metrics

The Health Index is constructed from six independent structural metrics, each of which measures a different aspect of the repository graph:

| # | Metric       | What It Measures                                       | Weight |
|---|--------------|--------------------------------------------------------|-------:|
| 1 | **Cycles**     | Circular relationships among files and symbols         |    28% |
| 2 | **Coupling**   | Overall structural connectivity (in + out degree)      |    23% |
| 3 | **Fan-out**    | Concentration of outgoing relationships               |    18% |
| 4 | **Fan-in**     | Concentration of incoming relationships               |    14% |
| 5 | **Dependency** | External dependency usage density across files        |    10% |
| 6 | **Modules**    | Proportion of module nodes in the graph               |     7% |

Each metric independently produces a health score between 0 and 100. These six scores are then combined using a weighted sum to produce the final Health Index.

---

## The Aggregation Formula

$$
H =
C \times 0.28 +
Co \times 0.23 +
Fo \times 0.18 +
Fi \times 0.14 +
D \times 0.10 +
M \times 0.07
$$

Where:

| Symbol | Metric |
|--------|--------|
| $C$    | Cycle Health score |
| $Co$   | Coupling Health score |
| $Fo$   | Fan-out Health score |
| $Fi$   | Fan-in Health score |
| $D$    | Dependency Health score |
| $M$    | Module Health score |

The weights sum to exactly 1.00:

$$
0.28 + 0.23 + 0.18 + 0.14 + 0.10 + 0.07 = 1.00
$$

Therefore the result $H$ is always on the same 0–100 scale as the individual metric scores.

---

## TypeScript Entry Point

The final Health Index is computed by a single pure function:

```ts
export function calculateHealthIndex(graph: Graph): RepositoryHealthResult
```

### Input

```ts
graph: Graph
```

The complete in-memory graph produced by the Graph Builder from a parsed repository.

### Output

```ts
export interface RepositoryHealthResult {
    index: number;

    metrics: {
        cycles: CycleHealthResult;
        coupling: CouplingHealthResult;
        fanOut: FanOutHealthResult;
        fanIn: FanInHealthResult;
        dependency: DependencyHealthResult;
        modules: ModuleHealthResult;
    };
}
```

| Field | Type | Description |
|-------|------|-------------|
| `index` | `number` | Final weighted Health Index, 0–100 |
| `metrics.cycles` | `CycleHealthResult` | Score + raw measurements for cycle health |
| `metrics.coupling` | `CouplingHealthResult` | Score + structural degree data |
| `metrics.fanOut` | `FanOutHealthResult` | Score + average, RMS, maximum fan-out |
| `metrics.fanIn` | `FanInHealthResult` | Score + average, RMS, highest fan-in |
| `metrics.dependency` | `DependencyHealthResult` | Score + dependency relationship counts |
| `metrics.modules` | `ModuleHealthResult` | Score + module count and ratio |

### Implementation

```ts
const HEALTH_WEIGHTS = {
    cycles: 0.28,
    coupling: 0.23,
    fanOut: 0.18,
    fanIn: 0.14,
    dependency: 0.10,
    modules: 0.07,
} as const;

export function calculateHealthIndex(graph: Graph): RepositoryHealthResult {
    const cycles     = calculateCycleHealth(graph);
    const coupling   = calculateCouplingHealth(graph);
    const fanOut     = calculateFanOutHealth(graph);
    const fanIn      = calculateFanInHealth(graph);
    const dependency = calculateDependencyHealth(graph);
    const modules    = calculateModuleHealth(graph);

    const index =
        cycles.score     * HEALTH_WEIGHTS.cycles     +
        coupling.score   * HEALTH_WEIGHTS.coupling   +
        fanOut.score     * HEALTH_WEIGHTS.fanOut     +
        fanIn.score      * HEALTH_WEIGHTS.fanIn      +
        dependency.score * HEALTH_WEIGHTS.dependency +
        modules.score    * HEALTH_WEIGHTS.modules;

    return { index, metrics: { cycles, coupling, fanOut, fanIn, dependency, modules } };
}
```

`calculateHealthIndex` is a pure aggregator. It delegates all raw measurement and normalization to each metric's own calculator. It does not traverse the graph itself.

---

## Score Interpretation

The final Health Index is normalized to the range [0, 100]:

| Score Range | Structural Interpretation |
|-------------|--------------------------|
| 90 – 100    | Very healthy structural profile. Few or no measurable structural risks. |
| 75 – 90     | Generally healthy. Some structural complexity exists but is not dominant. |
| 50 – 75     | Noticeable structural complexity or risk. Specific metrics warrant investigation. |
| 25 – 50     | Significant structural concerns. Multiple metrics are in an elevated-risk range. |
| 0 – 25      | Severe structural concerns. The graph exhibits strong indicators of structural degradation. |

> These ranges are **interpretive guides**, not engineering thresholds. A repository with a score of 74 is not categorically different from one scoring 76.

---

## Why Metrics Are Weighted Differently

Not all structural properties carry equal architectural significance. The current weights reflect the following reasoning:

**Cycles (28%)** — The highest weight. Circular dependencies are one of the strongest indicators of architectural coupling and can make the codebase difficult to test, build, and refactor. They constrain the dependency ordering of the entire graph.

**Coupling (23%)** — The second highest. Structural degree (total incoming + outgoing) represents the broadest picture of how interconnected the graph is. Highly coupled systems tend to have more unintended transitive effects from localized changes.

**Fan-out (18%)** — High outgoing connectivity from a small number of nodes creates architectural hotspots. Nodes with high fan-out have a large outward structural surface and represent points of potential brittleness.

**Fan-in (14%)** — High incoming connectivity identifies nodes that many others depend on. These hub nodes must be carefully managed because changes to them can have wide impact. Slightly less dangerous than fan-out because depending on something is generally safer than something depending on you.

**Dependency (10%)** — Measures external package usage density. Important for evaluating external exposure, but does not necessarily reflect internal architectural problems. Given lower weight accordingly.

**Modules (7%)** — The lowest weight. Module nodes represent a small structural category within the graph. Their presence carries information about the graph's completeness, but module count alone is rarely a primary health concern.

---

## The Three-Phase Pipeline: Measure → Normalize → Aggregate

The Health Index follows a strict three-phase pipeline:

### Phase 1: Raw Measurement

Each metric calculator traverses the graph and extracts raw structural quantities:

```text
cycleRatio              = 0.00038
averageStructuralDegree = 0.1987
rootMeanSquareFanOut    = 0.992
rootMeanSquareFanIn     = 0.344
avgDependenciesPerFile  = 1.067
moduleRatio             = 0.00069
```

These raw values exist on different scales and cannot be compared or combined directly.

### Phase 2: Normalization

Each raw measurement is converted into a 0–100 health score using a metric-specific normalization formula. Two normalization strategies are used:

**Linear normalization** (used for cycles and modules, where the raw value is already bounded [0,1]):

$$
\text{Health} = 100 \times (1 - \text{Risk})
$$

**Reciprocal normalization** (used for coupling, fan-out, fan-in, dependency, where the raw value is unbounded):

$$
\text{Health} = \frac{100}{1 + k \cdot x}
$$

where $x$ is the raw measurement and $k$ is a calibration factor.

After normalization, all metrics speak the same language: 0–100.

### Phase 3: Weighted Aggregation

The normalized scores are combined using the weighted formula to produce the final Health Index.

---

## Calculation Pipeline Diagram

```
Canonical Graph
      │
      ├─── Cycle Analysis
      │         └─── CycleRatio ──→ CycleHealth (28%)
      │
      ├─── Structural Degree Analysis
      │         └─── AverageStructuralDegree ──→ CouplingHealth (23%)
      │
      ├─── Outgoing Relationship Analysis
      │         └─── RMS FanOut ──→ FanOutHealth (18%)
      │
      ├─── Incoming Relationship Analysis
      │         └─── RMS FanIn ──→ FanInHealth (14%)
      │
      ├─── File → Dependency Analysis
      │         └─── AvgDependenciesPerFile ──→ DependencyHealth (10%)
      │
      └─── Module Node Analysis
                └─── ModuleRatio ──→ ModuleHealth (7%)
                                            │
                                            ▼
                                  Weighted Summation
                                            │
                                            ▼
                                    Health Index (0–100)
```

---

## Design Principles

### Continuity over thresholds

CodeGraph deliberately avoids classifying structural properties into discrete "good" and "bad" buckets. Instead, each normalization function is continuous: a small change in the raw measurement produces a proportional change in the health score. This avoids arbitrary scoring cliffs.

### Transparency

Each metric exposes its raw measurements, its normalized risk, its scoring formula, and its weight. The Health Index is never a "black box number." A developer should always be able to trace:

```
Health Index 84.6
    ↓ is produced by six weighted scores
Cycles: 99.6 × 0.28 = 27.9
Coupling: 90.9 × 0.23 = 20.9
...
    ↓ each score is produced by a normalization of a raw measurement
CycleRatio = 0.00038
    ↓ which is measured from the canonical graph
5 cyclic symbols out of 1310 total symbols
```

### Independence

Each metric calculator is a pure function of the graph. No metric calculator reads the output of another. This means metrics can be recalculated individually, extended independently, or recalibrated without affecting other metrics.

### Recalibrability

All calibration factors (`k` values) and weights are explicit constants in the source code. They are not embedded in a learned model or derived from training data. This means they can be adjusted as CodeGraph is validated against more repositories.

---

## Limitations

The Health Index measures **structural properties observable in CodeGraph's static graph**. It does not measure:

- **Correctness** — logic bugs, off-by-one errors, type errors
- **Test coverage or quality** — presence, completeness, or reliability of tests
- **Performance** — algorithmic complexity, memory usage, runtime behavior
- **Security** — vulnerability patterns, input validation, authentication
- **Readability** — naming, formatting, comments, cognitive complexity
- **Business logic quality** — whether the code does the right thing
- **Documentation** — presence or quality of API documentation
- **Deployment reliability** — infrastructure, CI/CD, observability

A repository can have a very high Health Index and still contain critical bugs, security holes, or extremely hard-to-read code. Conversely, a lower structural score does not mean the code fails to serve its purpose.

> The Health Index is a heuristic structural signal, not a certification of software quality.

---

## Worked Example

Suppose a repository produces the following individual metric scores:

```text
Cycles     = 99.6    (very few cycles)
Coupling   = 90.9    (low average structural degree)
Fan-out    = 66.8    (moderate RMS fan-out)
Fan-in     = 85.3    (moderate RMS fan-in)
Dependency = 65.2    (above-average dep density)
Modules    = 99.9    (virtually no module nodes)
```

Applying the weighted formula:

$$
H =
99.6(0.28) +
90.9(0.23) +
66.8(0.18) +
85.3(0.14) +
65.2(0.10) +
99.9(0.07)
$$

$$
H =
27.89 +
20.91 +
12.02 +
11.94 +
6.52 +
6.99
$$

$$
H \approx 86.3
$$

The score of 86.3 falls in the "Generally healthy" band. The breakdown reveals that the fan-out and dependency metrics are the primary contributors pulling the score below 90, while cycles, coupling, and modules are near-perfect.

---

*See sections 9.1 – 9.6 for detailed documentation on each individual health metric.*
