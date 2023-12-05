import { Dialect, Model, Sequelize } from "sequelize"
export interface SqliteInfo {
    path: string // The path to the sqlite database
}

export interface DBMSInfo {
    type: Dialect,
    username: string,
    password: string,
    host: string,
    database: string,
    port?: number
}

export interface ConnectionOptions {
    host: string,
    dialect: string,
    port: number
}

export interface RawInfo {
    uri: string //example for postgress: 'postgres://user:pass@example.com:5432/dbname'
}

export type DBInfo = SqliteInfo | DBMSInfo | RawInfo;
