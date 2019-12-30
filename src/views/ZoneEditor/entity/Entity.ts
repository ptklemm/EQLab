export abstract class EQEntity
{
    public static readonly TYPE_BLOCKEDSPELL = 'BlockedSpell';
    public static readonly TYPE_DOOR         = 'Door';
    public static readonly TYPE_GRIDENTRY    = 'GridEntry';
    public static readonly TYPE_GROUNDSPAWN  = 'GroundSpawn';
    public static readonly TYPE_OBJECT       = 'Object';
    public static readonly TYPE_SAFEPOINT    = 'SafePoint';
    public static readonly TYPE_SPAWN        = 'Spawn';
    public static readonly TYPE_STARTZONE    = 'StartZone';
    public static readonly TYPE_TRAP         = 'Trap';
    public static readonly TYPE_UNDERWORLD   = 'Underworld';
    public static readonly TYPE_ZONEPOINT    = 'ZonePoint';

    
    public type:     string;
    public id:       number;
    public label_id: number;
    public mesh_id:  number;
    public data:     any;

    constructor(type: string, id: number, label_id: number, mesh_id: number)
    {
        this.type     = type;
        this.id       = id;
        this.label_id = label_id;
        this.mesh_id  = mesh_id;
    }

    public static GetXField(entity_type: string): string
    {
        switch (entity_type)
        {
            case EQEntity.TYPE_BLOCKEDSPELL:
            case EQEntity.TYPE_GRIDENTRY:
            case EQEntity.TYPE_SPAWN:
            case EQEntity.TYPE_STARTZONE:
            case EQEntity.TYPE_TRAP:
            case EQEntity.TYPE_ZONEPOINT:
                return 'x';
            case EQEntity.TYPE_DOOR:
                return 'pos_x';
            case EQEntity.TYPE_GROUNDSPAWN:
                return 'max_x';
            case EQEntity.TYPE_SAFEPOINT:
                return 'safe_x';
            default:
                return 'x';
        }
    }

    public static GetYField(entity_type: string): string
    {
        switch (entity_type)
        {
            case EQEntity.TYPE_BLOCKEDSPELL:
            case EQEntity.TYPE_GRIDENTRY:
            case EQEntity.TYPE_SPAWN:
            case EQEntity.TYPE_STARTZONE:
            case EQEntity.TYPE_TRAP:
            case EQEntity.TYPE_ZONEPOINT:
                return 'y';
            case EQEntity.TYPE_DOOR:
                return 'pos_y';
            case EQEntity.TYPE_GROUNDSPAWN:
                return 'max_y';
            case EQEntity.TYPE_SAFEPOINT:
                return 'safe_y';
            default:
                return 'y';
        }
    }

    public static GetZField(entity_type: string): string
    {
        switch (entity_type)
        {
            case EQEntity.TYPE_BLOCKEDSPELL:
            case EQEntity.TYPE_GRIDENTRY:
            case EQEntity.TYPE_SPAWN:
            case EQEntity.TYPE_STARTZONE:
            case EQEntity.TYPE_TRAP:
            case EQEntity.TYPE_ZONEPOINT:
                return 'z';
            case EQEntity.TYPE_DOOR:
                return 'pos_z';
            case EQEntity.TYPE_GROUNDSPAWN:
                return 'max_z';
            case EQEntity.TYPE_SAFEPOINT:
                return 'safe_z';
            default:
                return 'z';
        }
    }
}

export interface IDoorData
{
    id: number;
    doorid: number;
    zone: string | null;
    version: number;
    name: string;
    pos_y: number;
    pos_x: number;
    pos_z: number;
    heading: number;
    opentype: number;
    guild: number;
    lockpick: number;
    keyitem: number;
    keyitem_name: string | null;
    nokeyring: number;
    triggerdoor: number;
    triggertype: number;
    disable_timer: number;
    doorisopen: number;
    door_param: number;
    dest_zone: string | null;
    dest_instance: number;
    dest_x: number | null;
    dest_y: number | null;
    dest_z: number | null;
    dest_heading: number | null;
    invert_state: number | null;
    incline: number | null;
    size: number;
    buffer: number | null;
    client_version_mask: number;
    is_ldon_door: number;
}

export class Door extends EQEntity
{
    public data: IDoorData;

    constructor(id: number, label_id: number, mesh_id: number, data: IDoorData)
    {
        super(EQEntity.TYPE_DOOR, id, label_id, mesh_id);
        this.data = data;
    }
}

export interface IGroundSpawnData
{
    id: number;
    zoneid: number;
    version: number;
    max_x: number;
    max_y: number;
    max_z: number;
    min_x: number;
    min_y: number;
    heading: number;
    name: string;
    item: number;
    item_name: string;
    max_allowed: number;
    comment: string;
    respawn_timer: number;
}

export class GroundSpawn extends EQEntity
{
    public data: IGroundSpawnData;

    constructor(id: number, label_id: number, mesh_id: number, data: IGroundSpawnData)
    {
        super(EQEntity.TYPE_GROUNDSPAWN, id, label_id, mesh_id);
        this.data = data;
    }
}

export interface ISpawnData
{
    id: number;
    spawngroupID: number;
    zone: string | null;
    version: number;
    x: number;
    y: number;
    z: number;
    heading: number;
    respawntime: number;
    variance: number;
    pathgrid: number;
    _condition: number;
    cond_value: number;
    enabled: number;
    animation: number;
    spawngroup: ISpawngroupData | null;
}

export interface ISpawngroupData
{
    id: number;
    name: string;
    spawn_limit: number;
    dist: number;
    max_x: number;
    min_x: number;
    max_y: number;
    min_y: number;
    delay: number;
    mindelay: number;
    despawn: number;
    despawn_timer: number;
    spawnentries: ISpawnEntryData[];
}

export interface ISpawnEntryData
{
    spawngroupID: number;
    npcID: number;
    chance: number;
    npc: ISpawnEntryNPCData;
}

export interface ISpawnEntryNPCData
{
    name: string;
    level: number;
    maxlevel: number;
    race: number;
    gender: number;
    texture: number;
    aggroradius: number;
    assistradius: number;
}

export class Spawn extends EQEntity
{
    public data: ISpawnData;

    constructor(id: number, label_id: number, mesh_id: number, data: ISpawnData)
    {
        super(EQEntity.TYPE_SPAWN, id, label_id, mesh_id);
        this.data = data;
    }
}

export interface ITrapData
{
    id: number;
    zone: string;
    version: number;
    x: number;
    y: number;
    z: number;
    chance: number;
    maxzdiff: number;
    radius: number;
    effect: number;
    effectvalue: number;
    spell_name: string;
    npc_name: string;
    effectvalue2: number;
    message: string;
    skill: number;
    level: number;
    respawn_time: number;
    respawn_var: number;
    triggered_number: number;
    group: number;
    despawn_when_triggered: number;
    undetectable: number;
}

export class Trap extends EQEntity
{
    public data: ITrapData

    constructor(id: number, label_id: number, mesh_id: number, data: ITrapData)
    {
        super(EQEntity.TYPE_TRAP, id, label_id, mesh_id);
        this.data = data;
    }
}
