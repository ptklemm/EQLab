import Treeize from 'treeize';
import StandardQueryList from './StandardQueryList';
import DatabaseConnection from './Database';
import { ISpawnData } from '../views/ZoneEditor/entity/Entity';

export default class Spawn2QueryList extends StandardQueryList
{
    constructor(db: DatabaseConnection)
    {
        super(db, 'spawn2');
    }

    async Tree(id: number): Promise<ISpawnData>
    {
        let query = `
        SELECT spawn2.id AS 'id', spawn2.zone, spawn2.version, spawn2.x, spawn2.y, spawn2.z, spawn2.enabled, spawn2.heading,
        spawn2.respawntime, spawn2.variance, spawn2.pathgrid, spawn2._condition, spawn2.cond_value, spawn2.animation, spawn2.spawngroupID,
        spawngroup.id AS 'spawngroup:id', spawngroup.name AS 'spawngroup:name', spawngroup.spawn_limit AS 'spawngroup:spawn_limit',
        spawngroup.dist AS 'spawngroup:dist', spawngroup.min_x AS 'spawngroup:min_x', spawngroup.min_y AS 'spawngroup:min_y',
        spawngroup.max_x AS 'spawngroup:max_x', spawngroup.max_y AS 'spawngroup:max_y', spawngroup.mindelay AS 'spawngroup:mindelay',
        spawngroup.delay AS 'spawngroup:delay', spawngroup.despawn AS 'spawngroup:despawn', spawngroup.despawn_timer AS 'spawngroup:despawn_timer',
        spawnentry.spawngroupID AS 'spawngroup:spawnentries:spawngroupID', spawnentry.npcID AS 'spawngroup:spawnentries:npcID', spawnentry.chance AS 'spawngroup:spawnentries:chance',
        npc_types.name AS 'spawngroup:spawnentries:npc:name', npc_types.level AS 'spawngroup:spawnentries:npc:level', 
        npc_types.maxlevel AS 'spawngroup:spawnentries:npc:maxlevel', npc_types.race AS 'spawngroup:spawnentries:npc:race',
        npc_types.gender AS 'spawngroup:spawnentries:npc:gender', npc_types.texture AS 'spawngroup:spawnentries:npc:texture',
        npc_types.aggroradius AS 'spawngroup:spawnentries:npc:aggroradius', npc_types.assistradius AS 'spawngroup:spawnentries:npc:assistradius'
        FROM spawn2
        LEFT JOIN spawngroup ON spawn2.spawngroupID = spawngroup.id
        LEFT JOIN spawnentry ON spawn2.spawngroupID = spawnentry.spawngroupID
        LEFT JOIN npc_types ON spawnentry.npcID = npc_types.id
        WHERE spawn2.id = ${id}
        `;

        const results = await this._db.rawAll(query);
        const tree = new Treeize().grow(results).getData();
        return tree[0];
    }
}
