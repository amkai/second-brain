declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string): { columns: string[]; values: any[][] }[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    getRowsModified(): number;
  }

  interface Statement {
    bind(params?: any[]): boolean;
    step(): boolean;
    get(): any[];
    getColumnNames(): string[];
    free(): void;
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  export default function initSqlJs(config?: any): Promise<SqlJsStatic>;
  export type { Database, Statement, SqlJsStatic };
}
