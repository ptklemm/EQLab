import mysql         from 'mysql';
import StandardQueryList from './StandardQueryList';
import ZoneQueryList from './Zone';
import Spawn2QueryList from './Spawn2';

export default class DatabaseConnection
{
    public Zone:       ZoneQueryList;
    public Spawn2:     Spawn2QueryList;
    public SpawnGroup: StandardQueryList; 

    private _connection: mysql.Connection;

    constructor(config: mysql.ConnectionConfig)
    {
        this._connection = mysql.createConnection(config);
        this.Zone       = new ZoneQueryList(this);
        this.Spawn2     = new Spawn2QueryList(this);
        this.SpawnGroup = new StandardQueryList(this, 'spawngroup');
    }

    public get connection()
    {
        return this._connection;
    }

    public Connect(): Promise<void>
    {
        return new Promise((resolve, reject) => {
            this._connection.connect((error) => {
                if (error)
                    reject(error);
    
                console.log(`Database connected as ID ${this._connection.threadId}`);
                resolve();
            });
        });
    }

    public End(): Promise<void>
    {
        return new Promise((resolve, reject) => {
            this._connection.end((error) => {
                if (error)
                    reject(error);
    
                console.log('Database connection closed.');
                resolve();
            });
        });
    }

    public rawAll(querystr: string, ): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this._connection.query(querystr, (err, results) => {
                if (err)
                    reject(err);

                resolve(results);
            });
        });
    }

    public rawFirst(querystr: string): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this._connection.query(querystr, (err, results) => {
                if (err)
                    reject(err);

                resolve(results[0]);
            });
        });
    }

    public queryAll(querystr: string, values: any): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this._connection.query(querystr, values, (err, results) => {
                if (err)
                    reject(err);

                resolve(results);
            });
        });
    }

    public queryFirst(querystr: string, values: any): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this._connection.query(querystr, values, (err, results) => {
                if (err)
                    reject(err);

                resolve(results[0]);
            });
        });
    }
}
