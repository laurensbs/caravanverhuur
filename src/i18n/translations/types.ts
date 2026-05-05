// Shared dict-shape voor alle locale files. Houdt de import-graph
// minimaal — locale-files hoeven niet onderling type info te delen.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dict = Record<string, any>;
