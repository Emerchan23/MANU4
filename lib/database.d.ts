import { DatabaseResult, DatabaseRow, QueryResult } from '../types/database';

// Para operações SELECT que retornam dados
export function query(sql: string, params?: any[]): Promise<DatabaseRow[]>;

// Para operações INSERT/UPDATE/DELETE que retornam resultado com insertId
export function execute(sql: string, params?: any[]): Promise<DatabaseResult>;

// Função auxiliar
export function getNextNumber(entityType: string): Promise<string>;
export function createPool(): any;