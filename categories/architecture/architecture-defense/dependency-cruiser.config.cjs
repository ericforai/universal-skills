/**
 * J2: SELF-CHECK (Frontend)
 * J3: CLOSED RULES
 *
 * dependency-cruiser configuration for frontend architecture governance.
 * Validates import dependencies against architectural rules.
 *
 * Run: npx depcruise --config dependency-cruiser.config.cjs src
 * CI: Blocks PRs if violations are found (J4: Reflex)
 */

module.exports = {
  forbidden: [
    /* ========================================
     * RULE 1: No Internal File Imports Across Features
     * Prevents: components importing from other features' internal files
     * ======================================== */
    {
      name: 'no-internal-imports-from-other-features',
      severity: 'error',
      from: {
        path: 'src/features/[^/]+',
        pathNot: ['node_modules', 'dist', 'build']
      },
      to: {
        path: [
          'src/features/[^/]+/(internal|private|utils/internal|components/internal)/**'
        ],
        pathNot: [
          // Allow own internal files
          ({ fromFileName, toFileName }) => {
            const fromFeature = fromFileName.match(/src\/features\/([^/]+)/)?.[1];
            const toFeature = toFileName.match(/src\/features\/([^/]+)/)?.[1];
            return fromFeature !== toFeature ? toFileName : null;
          }
        ]
      },
      comment: 'Components cannot import internal files from other features'
    },

    /* ========================================
     * RULE 2: UI Components Cannot Access Data Layer
     * Prevents: UI components depending on database models
     * ======================================== */
    {
      name: 'no-data-layer-in-ui',
      severity: 'error',
      from: {
        path: [
          'src/features/**/components/**',
          'src/features/**/hooks/**',
          'src/features/**/views/**'
        ]
      },
      to: {
        path: [
          'src/data/database/**',
          'src/data/models/**',
          'src/data/repositories/**',
          'src/shared/database/**'
        ],
        // Allow types (interfaces) but not implementations
        pathNot: ['**/*.types.ts', '**/*.interfaces.ts', '**/types/**']
      },
      comment: 'UI components must use services, not access database models directly'
    },

    /* ========================================
     * RULE 3: No Circular Dependencies
     * Prevents: Circular dependencies between features
     * ======================================== */
    {
      name: 'no-circular-dependencies',
      severity: 'error',
      from: { path: 'src' },
      to: {
        circular: true
      },
      comment: 'Circular dependencies detected - refactor module boundaries'
    },

    /* ========================================
     * RULE 4: No Feature-to-Feature Direct Imports
     * Forces communication through shared layer or events
     * ======================================== */
    {
      name: 'no-feature-to-feature-imports',
      severity: 'warn',
      from: {
        path: 'src/features/[^/]+',
        pathNot: [
          'node_modules',
          'src/shared',
          'src/features/**/index.ts' // Allow barrel exports
        ]
      },
      to: {
        path: ['src/features/[^/]+'],
        pathNot: ({ fromFileName, toFileName }) => {
          const fromFeature = fromFileName.match(/src\/features\/([^/]+)/)?.[1];
          const toFeature = toFileName.match(/src\/features\/([^/]+)/)?.[1];

          // Allow imports from same feature
          if (fromFeature === toFeature) return toFileName;

          // Allow imports from shared utilities
          if (toFileName.includes('/src/shared/')) return null;

          // Block direct feature-to-feature imports
          return toFeature && fromFeature !== toFeature ? toFileName : null;
        }
      },
      comment: 'Features should communicate through shared services/events, not direct imports'
    },

    /* ========================================
     * RULE 5: Enforce Layer Hierarchy (UI → Business → Data)
     * ======================================== */
    {
      name: 'enforce-layer-hierarchy',
      severity: 'error',
      from: {
        path: ['src/data/**', 'src/shared/database/**']
      },
      to: {
        path: [
          'src/features/**/components/**',
          'src/features/**/hooks/**',
          'src/features/**/views/**'
        ]
      },
      comment: 'Data layer cannot import from UI layer (violates dependency inversion)'
    },

    /* ========================================
     * RULE 6: Server Code Cannot Import Client Code
     * ======================================== */
    {
      name: 'server-not-import-client',
      severity: 'error',
      from: {
        path: ['src/server/**', 'src/api/**']
      },
      to: {
        path: ['src/client/**', 'src/ui/**'],
        pathNot: ['**/*.types.ts', '**/shared/types/**']
      },
      comment: 'Server code must not depend on client code'
    },

    /* ========================================
     * RULE 7: Test Files Must Respect Production Boundaries
     * ======================================== */
    {
      name: 'test-files-respect-boundaries',
      severity: 'error',
      from: {
        path: '**/*.test.ts',
        pathNot: ['node_modules']
      },
      to: {
        path: ['src/features/[^/]+/internal/**'],
        pathNot: ({ fromFileName, toFileName }) => {
          // Allow testing own internals
          const fromFeature = fromFileName.match(/src\/features\/([^/]+)/)?.[1];
          const toFeature = toFileName.match(/src\/features\/([^/]+)/)?.[1];
          return fromFeature === toFeature ? null : toFileName;
        }
      },
      comment: 'Test files can only test internal code in their own feature'
    }
  ],

  allowed: [
    /* ========================================
     * EXCEPTIONS (Use sparingly!)
     * ======================================== */
    {
      name: 'allow-internal-testing-utilities',
      from: { path: '**/*.test.ts' },
      to: { path: 'src/shared/testing/**' },
      comment: 'Test utilities can use internal helpers'
    }
  ],

  options: {
    /* ========================================
     * PRESETS
     * ======================================== */
    preset: 'warn-only',

    /* ========================================
     * OUTPUT FORMATS
     * ======================================== */
    outputType: 'json', // For CI parsing

    /* ========================================
     * MODULE SYSTEMS
     * ======================================== */
    moduleSystems: ['ts', 'tsx', 'js', 'jsx'],

    /* ========================================
     * EXCLUDE PATTERNS
     * ======================================== */
    exclude: [
      'node_modules/.*',
      'dist/.*',
      'build/.*',
      'coverage/.*',
      '*.config.js',
      '*.config.ts'
    ],

    /* ========================================
     * TS CONFIG
     * ======================================== */
    tsConfig: {
      fileName: 'tsconfig.json'
    },

    /* ========================================
     * DO NOT FOLLOW
     * ======================================== */
    doNotFollow: 'node_modules',

    /* ========================================
     * EXTRA RULES
     * ======================================== */
    exoticRequireValuesAllowed: false,
    reporterOptions: {
      json: {
        outputTo: 'dependency-cruiser-report.json'
      },
      dot: {
        collapsePattern: 'node_modules/[^/]+'
      },
      archi: {
        collapsePattern: [
          '^(?:src/)?features/[^/]+/services',
          '^(?:src/)?features/[^/]+/components',
          '^(?:src/)?features/[^/]+/hooks'
        ]
      }
    }
  }
};
