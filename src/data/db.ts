import mysql from 'mysql';
import Treeize from 'treeize';

class StandardQueryList
{
    public db: DatabaseConnection;

    constructor(db: DatabaseConnection, table: string)
    {
        this.db = db;
    }

    async Select(id: string | number)
    {

    }

    async Insert()
    {

    }

    async Update()
    {

    }

    async Delete()
    {

    }
}

class ZoneQueryList
{
    db: DatabaseConnection;
    Spawn2: StandardQueryList;
    SpawnGroup: StandardQueryList; 
    SpawnEntry: StandardQueryList; 

    constructor(db: DatabaseConnection)
    {
        this.db = db;
        this.Spawn2 = new StandardQueryList(this.db, 'spawn2');
        this.SpawnGroup = new StandardQueryList(this.db, 'spawngroup');
        this.SpawnEntry = new StandardQueryList(this.db, 'spawnentry');
    }

    // General

    async List()
    {
        let query = `SELECT short_name, long_name, expansion FROM zone`;
        return await this.db.exec(query);
    }

    async FullData(zone_short_name: string)
    {
        
    }

    // Spawns

    async FullSpawnTree(zone_short_name: string)
    {
        let query = `
        SELECT spawn2.id AS 'id', spawn2.zone, spawn2.version, spawn2.x, spawn2.y, spawn2.z, spawn2.enabled, spawn2.heading,
        spawn2.respawntime, spawn2.variance, spawn2.pathgrid, spawn2._condition, spawn2.cond_value, spawn2.animation,
        spawngroup.id AS 'spawngroup:id', spawngroup.name AS 'spawngroup:name', spawngroup.spawn_limit AS 'spawngroup:spawn_limit',
        spawngroup.dist AS 'spawngroup:dist', spawngroup.min_x AS 'spawngroup:min_x', spawngroup.min_y AS 'spawngroup:min_y',
        spawngroup.max_x AS 'spawngroup:max_x', spawngroup.max_y AS 'spawngroup:max_y', spawngroup.mindelay AS 'spawngroup:mindelay',
        spawngroup.delay AS 'spawngroup:delay', spawngroup.despawn AS 'spawngroup:despawn', spawngroup.despawn_timer AS 'spawngroup:despawn_timer',
        spawnentry.chance AS 'spawngroup:spawnentries:chance', spawnentry.npcID AS 'spawngroup:spawnentries:npc_id', 
        npc_types.name AS 'spawngroup:spawnentries:npc_name', npc_types.level AS 'spawngroup:spawnentries:npc_level', 
        npc_types.maxlevel AS 'spawngroup:spawnentries:npc_maxlevel', npc_types.race AS 'spawngroup:spawnentries:npc_race',
        npc_types.gender AS 'spawngroup:spawnentries:npc_gender', npc_types.texture AS 'spawngroup:spawnentries:npc_texture'
        FROM spawn2
        LEFT JOIN spawngroup ON spawn2.spawngroupID = spawngroup.id
        LEFT JOIN spawnentry ON spawn2.spawngroupID = spawnentry.spawngroupID
        LEFT JOIN npc_types ON spawnentry.npcID = npc_types.id
        WHERE spawn2.zone = '${zone_short_name}'
        `;

        const result = await this.db.exec(query);
        return new Treeize().grow(result).getData();
    }

    async SingleSpawnTree()
    {

    }

    async SingleSpawngroupTree()
    {

    }

    // Grid

    async Grid()
    {

    }


}

export default class DatabaseConnection
{
    public connection: mysql.Connection;
    public Zone: ZoneQueryList;

    constructor(config: mysql.ConnectionConfig)
    {
        this.connection = mysql.createConnection(config);
        this.Zone = new ZoneQueryList(this);
    }

    public Connect(): any
    {
        this.connection.connect((error) => {
            if (error)
                console.error(error);

            console.log('Database connected as id ' + this.connection.threadId);
        });
    }

    public End(): void
    {
        this.connection.end();
    }

    public exec(querystr: string): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this.connection.query(querystr, (err, result) => {
                if (err)
                    reject(err);

                resolve(result);
            });
        });
    }
}
