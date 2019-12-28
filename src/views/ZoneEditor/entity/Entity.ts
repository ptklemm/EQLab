import { IDoorData } from '../types/door';

export abstract class EQEntity
{
    public static readonly TYPE_BLOCKEDSPELL = 'Blocked Spell';
    public static readonly TYPE_DOOR         = 'Door';
    public static readonly TYPE_GRIDENTRY    = 'Grid Entry';
    public static readonly TYPE_GROUNDSPAWN  = 'Ground Spawn';
    public static readonly TYPE_OBJECT       = 'Object';
    public static readonly TYPE_SAFEPOINT    = 'Safe Point';
    public static readonly TYPE_SPAWN        = 'Spawn';
    public static readonly TYPE_STARTZONE    = 'Start Zone';
    public static readonly TYPE_TRAP         = 'Trap';
    public static readonly TYPE_UNDERWORLD   = 'Underworld';
    public static readonly TYPE_ZONEPOINT    = 'Zone Point';

    
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

export class Door extends EQEntity
{
    public data: any;

    constructor(id: number, label_id: number, mesh_id: number, data: any)
    {
        super(EQEntity.TYPE_DOOR, id, label_id, mesh_id);
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
    spawngroup: ISpawngroupData;
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
    chance: number;
    npc_id: number;
    npc_name: string;
    npc_level: number;
    npc_maxlevel: number;
    npc_race: number;
    npc_gender: number;
    npc_texture: number;
    npc_aggroradius: number;
    npc_assistradius: number;
}

export class Spawn extends EQEntity
{
    public data: ISpawnData;

    constructor(id: number, label_id: number, mesh_id: number, data: any)
    {
        super(EQEntity.TYPE_SPAWN, id, label_id, mesh_id);
        this.data = data;
    }
}

