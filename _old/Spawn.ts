import { db, StandardQueryList} from "./Database";

export const Spawn = {
    ...StandardQueryList('spawn2'),

    Tree: (spawn_id: number) => {
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
        WHERE spawn2.id = '${spawn_id}'
        `;

        return db.execTree(query);
    }
}

export const Spawngroup = {
    ...StandardQueryList('spawngroup'),

    Tree: (spawngroup_id: number) => {
        let query = `
        SELECT spawngroup.id, spawngroup.name, spawngroup.spawn_limit,
        spawngroup.dist, spawngroup.min_x, spawngroup.min_y,
        spawngroup.max_x, spawngroup.max_y, spawngroup.mindelay,
        spawngroup.delay, spawngroup.despawn, spawngroup.despawn_timer,
        spawnentry.chance AS 'spawnentries:chance', 
        spawnentry.npcID AS 'spawnentries:npc_id', npc_types.name AS 'spawnentries:npc_name',
        npc_types.level AS 'spawnentries:npc_level', npc_types.maxlevel AS 'spawnentries:npc_maxlevel'
        FROM spawngroup
        LEFT JOIN spawnentry ON spawngroup.id = spawnentry.spawngroupID
        LEFT JOIN npc_types ON spawnentry.npcID = npc_types.id
        WHERE spawngroup.id = '${spawngroup_id}'
        `;

        return db.execTree(query);
    }
}
