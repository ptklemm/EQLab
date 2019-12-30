import mysql         from 'mysql';
import StandardQueryList from './StandardQueryList';
import ZoneQueryList from './Zone';
import Spawn2QueryList from './Spawn2';

export default class DatabaseConnection
{
    public BlockedSpell: StandardQueryList;
    public Door:         StandardQueryList;
    public Fishing:      StandardQueryList;
    public Forage:       StandardQueryList;
    public Grid:         StandardQueryList;
    public GroundSpawn:  StandardQueryList;
    public Object:       StandardQueryList;
    public Spawn2:       Spawn2QueryList;
    public SpawnGroup:   StandardQueryList; 
    public StartZone:    StandardQueryList;
    public Trap:         StandardQueryList;
    public Zone:         ZoneQueryList;
    public ZonePoint:    StandardQueryList;

    private _connection: mysql.Connection;

    constructor(config: mysql.ConnectionConfig)
    {
        this._connection = mysql.createConnection(config);
        
        this.BlockedSpell = new StandardQueryList(this, 'blocked_spells');
        this.Door         = new StandardQueryList(this, 'doors');
        this.Fishing      = new StandardQueryList(this, 'fishing');
        this.Forage       = new StandardQueryList(this, 'forage');
        this.Grid         = new StandardQueryList(this, 'grid');
        this.GroundSpawn  = new StandardQueryList(this, 'ground_spawns');
        this.Object       = new StandardQueryList(this, 'object');
        this.Spawn2       = new Spawn2QueryList(this);
        this.SpawnGroup   = new StandardQueryList(this, 'spawngroup');
        this.StartZone    = new StandardQueryList(this, 'start_zones');
        this.Trap         = new StandardQueryList(this, 'traps');
        this.Zone         = new ZoneQueryList(this);
        this.ZonePoint    = new StandardQueryList(this, 'zone_points');
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
