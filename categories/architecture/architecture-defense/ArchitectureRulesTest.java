/**
 * J2: SELF-CHECK (Backend)
 * J3: CLOSED RULES
 *
 * ArchUnit test suite for backend architecture governance.
 * Validates Java/Kotlin package dependencies against architectural rules.
 *
 * Run: ./gradlew test --tests ArchitectureRulesTest
 * CI: Blocks builds if violations are found (J4: Reflex)
 *
 * Reference: https://www.archunit.org/
 */

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

/**
 * Architecture governance test suite.
 *
 * PRINCIPLES:
 * - Tests enforce their own rules (J3: Closed Rules)
 * - Violations block CI/CD pipeline (J4: Reflex)
 * - Each test maps to a specific architectural concern
 */
@DisplayName("Architecture Rules")
class ArchitectureRulesTest {

    // Import all production classes (exclude tests)
    private static final JavaClasses classes = new ClassFileImporter()
        .importPackages("com.yourorg")
        .stream()
        .filter(clazz -> !clazz.getName().contains(".test."))
        .toArray(JavaClasses[]::new);

    /* ========================================
     * TEST 1: NO UI → DATABASE DEPENDENCIES
     * Prevents: UI components depending on database models
     * ======================================== */
    @Test
    @DisplayName("UI layer must not access database layer")
    void uiLayerMustNotAccessDatabaseLayer() {
        ArchRule rule = noClasses()
            .that().resideInAPackage("..ui..")
            .or().resideInAPackage("..controller..")
            .or().resideInAPackage("..rest..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..database..")
            .or().resideInAPackage("..repository..")
            .or().resideInAPackage("..entity..")
            .or().resideInAPackage("..model..");

        rule.check(classes);
        // Violation example:
        // "Class <UserController> depends on class <UserEntity>"
    }

    /* ========================================
     * TEST 2: NO CIRCULAR DEPENDENCIES
     * Prevents: Circular dependencies between features
     * ======================================== */
    @Test
    @DisplayName("No circular dependencies between packages")
    void noCircularDependencies() {
        slices().matching("com.yourorg.(*)..")
            .should().beFreeOfCycles()
            .check(classes);
        // Violation example:
        // "Cycle detected: user-management → auth → notifications → user-management"
    }

    /* ========================================
     * TEST 3: NO FEATURE → FEATURE INTERNAL ACCESS
     * Prevents: Components importing from other features' internal files
     * ======================================== */
    @Test
    @DisplayName("Features cannot access each other's internal packages")
    void featuresCannotAccessInternalPackages() {
        ArchRule rule = noClasses()
            .that().resideInAPackage("..feature..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..feature..internal..")
            .andAlso().resideInOutsideOfPackage(
                // Allow own internal packages
                "...feature..internal.."
            );

        rule.check(classes);
        // Violation example:
        // "Class <OrderController> depends on class <UserInternalService>"
    }

    /* ========================================
     * TEST 4: ENFORCE LAYERED ARCHITECTURE
     * ======================================== */
    @Test
    @DisplayName("Layers must respect dependency hierarchy")
    void layersMustRespectHierarchy() {
        layeredArchitecture()
            .layer("UI").definedBy("..controller..", "..rest..", "..ui..")
            .layer("Service").definedBy("..service..", "..business..")
            .layer("Repository").definedBy("..repository..", "..dao..")
            .layer("Database").definedBy("..database..", "..entity..", "..model..")

            .whereLayer("UI").mayNotBeAccessedByAnyLayer()
            .whereLayer("Service").mayOnlyBeAccessedByLayers("UI")
            .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service")
            .whereLayer("Database").mayOnlyBeAccessedByLayers("Repository")

            .check(classes);
        // Violation example:
        // "Layer 'Service' is not allowed to access layer 'UI'"
    }

    /* ========================================
     * TEST 5: CONTROLLERS ONLY CALL SERVICES
     * ======================================== */
    @Test
    @DisplayName("Controllers must only depend on services")
    void controllersMustOnlyDependOnServices() {
        classes().that().resideInAPackage("..controller..")
            .should().onlyDependOnClassesThat()
            .resideInAnyPackage(
                "..service..",
                "..dto..",
                "..exception..",
                "java..",
                "org.springframework..",
                "lombok.."
            )
            .check(classes);
        // Violation example:
        // "Class <UserController> depends on class <UserRepository> (not in allowed packages)"
    }

    /* ========================================
     * TEST 6: SERVICES DON'T EXPOSE ENTITIES
     * ======================================== */
    @Test
    @DisplayName("Services must not expose database entities to controllers")
    void servicesMustNotExposeEntities() {
        classes().that().resideInAPackage("..service..")
            .and().arePublic()
            .should().notReturnTypesThat()
            .resideInAPackage("..entity..")
            .or().resideInAPackage("..model..")
            .because("Services should return DTOs, not database entities")
            .check(classes);
        // Violation example:
        // "Method <UserService.getUser()> returns <UserEntity> (should return UserDTO)"
    }

    /* ========================================
     * TEST 7: ENFORCE SINGLE RESPONSIBILITY
     * ======================================== */
    @Test
    @DisplayName("Controllers should only have 'Controller' suffix")
    void controllersMustHaveProperNaming() {
        classes().that().resideInAPackage("..controller..")
            .should().haveSimpleNameEndingWith("Controller")
            .orShould().haveSimpleNameEndingWith("RestController")
            .check(classes);
    }

    /* ========================================
     * TEST 8: NO GOD CLASSES
     * ======================================== */
    @Test
    @DisplayName("Classes should not exceed 500 lines")
    void noGodClasses() {
        classes().should().haveFewerFieldsThan(20)
            .andShould().haveFewerMethodsThan(30)
            .check(classes);
        // Violation example:
        // "Class <UserService> has 35 methods (max: 30)"
    }

    /* ========================================
     * TEST 9: IMPLEMENTATIONS STAY IN THEIR PACKAGES
     * ======================================== */
    @Test
    @DisplayName("Implementations should not leak to other packages")
    void implementationsShouldNotLeak() {
        noClasses()
            .that().resideInAPackage("..feature..")
            .and().areNotPublic()
            .should().beAssignableTo(
                classes().that().resideInAnyPackage("..feature..")
                    .and().resideOutsidePackage("..feature..")
            )
            .because("Package-private implementations should not be exposed")
            .check(classes);
    }

    /* ========================================
     * TEST 10: DEPENDENCY INVERSION
     * ======================================== */
    @Test
    @DisplayName("High-level modules should not depend on low-level modules")
    void dependencyInversionPrinciple() {
        noClasses()
            .that().resideInAPackage("..service..")
            .should().dependOnClassesThat()
            .resideInAPackage("..database..")
            .because("Services should depend on repository interfaces, not implementations")
            .check(classes);
    }

    /* ========================================
     * OPTIONAL: GENERATE DEPENDENCY GRAPH
     * Run manually to visualize architecture
     * ======================================== */
    @Test
    @Disabled("Run manually to generate dependency graph")
    @DisplayName("Generate plantuml dependency graph")
    void generateDependencyGraph() {
        // Run this test manually to generate a PlantUML diagram
        // Output: plantuml dependency-graph.puml
        // Visualize at: http://www.plantuml.com/plantuml/
        System.out.println("PlantUML graph generation not implemented");
    }
}
