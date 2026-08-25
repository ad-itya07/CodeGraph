export interface DependencyNode {
    id: string;
    kind: "dependency";

    name: string;
    version: string;

    packageJsonPath: string;
}