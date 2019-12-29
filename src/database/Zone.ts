import Treeize from 'treeize';
import StandardQueryList from './StandardQueryList';
import DatabaseConnection from './Database';

export default class ZoneQueryList extends StandardQueryList
{
    constructor(db: DatabaseConnection)
    {
        super(db, 'zone');
    }

    async List()
    {
        return await this._db.rawAll('SELECT id, short_name, long_name, expansion FROM zone');
    }

    async Full(zone_short_name: string)
    {
        return {
            info:                 await this.Info(zone_short_name),
            blocked_spells:       await this.BlockedSpells(zone_short_name),
            doors:                await this.Doors(zone_short_name),
            incoming_doors:       await this.IncomingDoors(zone_short_name),
            fishing:              await this.Fishing(zone_short_name),
            forage:               await this.Forage(zone_short_name),
            grid:                 await this.Grid(zone_short_name),
            ground_spawns:        await this.GroundSpawns(zone_short_name),
            objects:              await this.Objects(zone_short_name),
            spawns:               await this.Spawns(zone_short_name),
            start_zones:          await this.StartZones(zone_short_name),
            traps:                await this.Traps(zone_short_name),
            zone_points:          await this.ZonePoints(zone_short_name),
            incoming_zone_points: await this.IncomingZonePoints(zone_short_name),
        }
    }

    async Info(zone_short_name: string)
    {
        return await this._db.rawFirst(`SELECT * FROM zone WHERE short_name = '${zone_short_name}'`);
    }

    async BlockedSpells(zone_short_name: string)
    {
        let query = `
        SELECT blocked_spells.id, blocked_spells.spellid, spells_new.name AS 'spellname', blocked_spells.type,
        blocked_spells.zoneid, blocked_spells.x, blocked_spells.y, blocked_spells.z, blocked_spells.x_diff,
        blocked_spells.y_diff, blocked_spells.z_diff, blocked_spells.message, blocked_spells.description
        FROM blocked_spells
        LEFT JOIN zone ON zone.zoneidnumber = blocked_spells.zoneid
        LEFT JOIN spells_new ON spells_new.id = blocked_spells.spellid
        WHERE zone.short_name = '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }

    async Doors(zone_short_name: string)
    {
        let query = `
        SELECT doors.id, doors.doorid, doors.zone, doors.version, doors.name, doors.pos_y, doors.pos_x, doors.pos_z,
        doors.heading, doors.opentype, doors.guild, doors.lockpick, doors.keyitem, items.Name AS 'keyitem_name', doors.nokeyring,
        doors.triggerdoor, doors.triggertype, doors.doorisopen, doors.door_param, doors.dest_zone, doors.dest_instance, doors.dest_x,
        doors.dest_y, doors.dest_z, doors.dest_heading, doors.invert_state, doors.incline, doors.size, doors.buffer, doors.client_version_mask,
        doors.is_ldon_door
        FROM doors
        LEFT JOIN zone ON doors.zone = zone.short_name
        LEFT JOIN items ON doors.keyitem = items.id
        WHERE zone.short_name = '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }

    async IncomingDoors(zone_short_name: string)
    {
        let query = `
        SELECT zone, doorid, dest_zone, dest_instance, dest_x, dest_y, dest_z, dest_heading
        FROM doors
        WHERE dest_zone = '${zone_short_name}' AND zone != '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }

    async Fishing(zone_short_name: string)
    {
        let query = `
        SELECT fishing.id, fishing.skill_level, fishing.chance, fishing.Itemid AS 'item_id', items.Name AS 'item_name', 
        fishing.npc_chance, fishing.npc_id, npc_types.name AS 'npc_name'
        FROM fishing
        LEFT JOIN zone ON fishing.zoneid = zone.zoneidnumber
        LEFT JOIN npc_types ON npc_types.id = fishing.npc_id
        LEFT JOIN items ON items.id = fishing.Itemid
        WHERE zone.short_name = '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }

    async Forage(zone_short_name: string)
    {
        let query = `
        SELECT forage.id, forage.level, forage.chance, forage.Itemid, items.Name
        FROM forage
        LEFT JOIN zone ON forage.zoneid = zone.zoneidnumber
        LEFT JOIN items ON items.id = forage.Itemid
        WHERE zone.short_name = '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }

    async Grid(zone_short_name: string)
    {
        let query = `
        SELECT grid.id, grid.zoneid, grid.type, grid.type2, grid_entries.zoneid AS 'grid_entries:zoneid', 
        grid_entries.gridid AS 'grid_entries:gridid', grid_entries.number AS 'grid_entries:number', 
        grid_entries.x AS 'grid_entries:x', grid_entries.y AS 'grid_entries:y', grid_entries.z AS 'grid_entries:z', 
        grid_entries.heading AS 'grid_entries:heading', grid_entries.pause AS 'grid_entries:pause'
        FROM grid
        LEFT JOIN zone ON grid.zoneid = zone.id
        LEFT JOIN grid_entries ON grid_entries.gridid = grid.id AND grid_entries.zoneid = zone.id
        WHERE zone.short_name = '${zone_short_name}'
        `;

        const results = await this._db.rawAll(query);
        return new Treeize().grow(results).getData();
    }

    async GroundSpawns(zone_short_name: string)
    {
        let query = `
        SELECT ground_spawns.id, ground_spawns.version, ground_spawns.max_x, ground_spawns.max_y, ground_spawns.max_z,
        ground_spawns.min_x, ground_spawns.min_y, ground_spawns.heading, ground_spawns.name, ground_spawns.item, items.Name AS 'item_name',
        ground_spawns.max_allowed, ground_spawns.comment, ground_spawns.respawn_timer
        FROM ground_spawns
        LEFT JOIN zone ON ground_spawns.zoneid = zone.zoneidnumber
        LEFT JOIN items ON ground_spawns.item = items.id
        WHERE zone.short_name = '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }

    async Objects(zone_short_name: string)
    {
        let query = `
        SELECT object.id, object.zoneid, object.version, object.xpos, object.ypos, object.zpos,
        object.heading, object.itemid, object.charges, object.objectname,
        object.type, object.icon, object.unknown08, object.unknown10, object.unknown20,
        object.unknown24, object.unknown60, object.unknown64, object.unknown68,
        object.unknown72, object.unknown76, object.unknown84, object.size,
        object.tilt_x, object.tilt_y
        FROM object
        LEFT JOIN zone ON object.zoneid = zone.zoneidnumber
        WHERE zone.short_name = '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }

    async Spawns(zone_short_name: string)
    {
        // let query = `
        // SELECT spawn2.id AS 'id', spawn2.zone, spawn2.version, spawn2.x, spawn2.y, spawn2.z, spawn2.enabled, spawn2.heading,
        // spawn2.respawntime, spawn2.variance, spawn2.pathgrid, spawn2._condition, spawn2.cond_value, spawn2.animation, spawn2.spawngroupID,
        // spawngroup.id AS 'spawngroup:id', spawngroup.name AS 'spawngroup:name', spawngroup.spawn_limit AS 'spawngroup:spawn_limit',
        // spawngroup.dist AS 'spawngroup:dist', spawngroup.min_x AS 'spawngroup:min_x', spawngroup.min_y AS 'spawngroup:min_y',
        // spawngroup.max_x AS 'spawngroup:max_x', spawngroup.max_y AS 'spawngroup:max_y', spawngroup.mindelay AS 'spawngroup:mindelay',
        // spawngroup.delay AS 'spawngroup:delay', spawngroup.despawn AS 'spawngroup:despawn', spawngroup.despawn_timer AS 'spawngroup:despawn_timer',
        // spawnentry.chance AS 'spawngroup:spawnentries:chance', spawnentry.npcID AS 'spawngroup:spawnentries:npc_id', 
        // npc_types.name AS 'spawngroup:spawnentries:npc_name', npc_types.level AS 'spawngroup:spawnentries:npc_level', 
        // npc_types.maxlevel AS 'spawngroup:spawnentries:npc_maxlevel', npc_types.race AS 'spawngroup:spawnentries:npc_race',
        // npc_types.gender AS 'spawngroup:spawnentries:npc_gender', npc_types.texture AS 'spawngroup:spawnentries:npc_texture',
        // npc_types.aggroradius AS 'spawngroup:spawnentries:npc_aggroradius', npc_types.assistradius AS 'spawngroup:spawnentries:npc_assistradius'
        // FROM spawn2
        // LEFT JOIN spawngroup ON spawn2.spawngroupID = spawngroup.id
        // LEFT JOIN spawnentry ON spawn2.spawngroupID = spawnentry.spawngroupID
        // LEFT JOIN npc_types ON spawnentry.npcID = npc_types.id
        // WHERE spawn2.zone = '${zone_short_name}'
        // `;

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
        WHERE spawn2.zone = '${zone_short_name}'
        `;

        const results = await this._db.rawAll(query);
        return new Treeize().grow(results).getData();
    }

    async StartZones(zone_short_name: string)
    {
        let query = `
        SELECT start_zones.x, start_zones.y, start_zones.z, start_zones.heading,
        start_zones.zone_id, start_zones.bind_id, start_zones.player_choice, start_zones.player_class,
        start_zones.player_deity, start_zones.player_race, start_zones.start_zone, start_zones.bind_x,
        start_zones.bind_y, start_zones.bind_z, start_zones.select_rank
        FROM start_zones
        LEFT JOIN zone ON start_zones.zone_id = zone.zoneidnumber
        WHERE zone.short_name = '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }

    async Traps(zone_short_name: string)
    {
        let query = `
        SELECT traps.id, traps.zone, traps.version, traps.x, traps.y, traps.z, traps.chance,
        traps.maxzdiff, traps.radius, traps.effect, traps.effectvalue, spells_new.name AS 'spell_name', npc_types.name AS 'npc_name',
        traps.effectvalue2, traps.message, traps.skill, traps.level, traps.respawn_time, traps.respawn_var
        FROM traps
        LEFT JOIN spells_new ON traps.effect = 0 AND traps.effectvalue = spells_new.id
        LEFT JOIN npc_types ON (traps.effect = 2 OR traps.effect = 3) AND traps.effectvalue = npc_types.id
        WHERE zone = '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }

    async ZonePoints(zone_short_name: string)
    {
        let query = `
        SELECT zone_points.id, zone_points.zone, zone_points.version, zone_points.number, zone_points.y,
        zone_points.x, zone_points.z, zone_points.heading, zone_points.target_y, zone_points.target_x,
        zone_points.target_z, zone_points.target_heading, zone_points.zoneinst, zone_points.target_zone_id,
        zone.short_name AS 'target_zone_short_name', zone_points.target_instance, zone_points.buffer, zone_points.client_version_mask
        FROM zone_points
        LEFT JOIN zone ON zone_points.target_zone_id = zone.zoneidnumber
        WHERE zone_points.zone = '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }

    async IncomingZonePoints(zone_short_name: string)
    {
        let query = `
        SELECT zone_points.id, zone_points.zone AS 'from_zone', zone_points.version AS 'from_zone_version', zone_points.target_y AS 'y', 
        zone_points.target_x AS 'x', zone_points.target_z AS 'z', zone_points.target_heading AS 'heading', zone_points.zoneinst, 
        zone_points.target_instance AS 'instance'
        FROM zone_points
        LEFT JOIN zone ON zone_points.target_zone_id = zone.zoneidnumber
        WHERE zone.short_name = '${zone_short_name}'
        `;

        return await this._db.rawAll(query);
    }
}
