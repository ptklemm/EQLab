import { Reducer } from 'redux';
import * as ACTION from './actions';
import {
    EQEntity,
    Door,
    GroundSpawn,
    Spawn,
    Trap
} from '../views/ZoneEditor/entity/Entity';
import { IZoneListEntry } from '../views/ZoneEditor/types/types';
import { IZoneInfo } from '../views/ZoneEditor/types/zone';

export interface IOptionsState
{
    show_safe_point:             boolean;
    show_underworld_plane:       boolean;
    show_roam_distance_cylinder: boolean;
    show_roam_limits_box:        boolean;
    show_doors:                  boolean;
    show_door_labels:            boolean;
    show_spawns:                 boolean;
    show_spawn_labels:           boolean;
    show_traps:                  boolean;
    show_trap_labels:            boolean;
}

function InitOptionsState(): IOptionsState
{
    return {
        show_safe_point:             false,
        show_underworld_plane:       false,
        show_roam_distance_cylinder: true,
        show_roam_limits_box:        true,
        show_doors:                  true,
        show_door_labels:            false,
        show_spawns:                 true,
        show_spawn_labels:           false,
        show_traps:                  true,
        show_trap_labels:            false,
    }
}

export interface IZoneDataState
{
    info:                 IZoneInfo | null;
    blocked_spells:       any[];
    doors:                Door[];
    incoming_doors:       any[];
    fishing:              any[];
    forage:               any[];
    grid:                 any[];
    ground_spawns:        GroundSpawn[];
    objects:              any[];
    spawns:               Spawn[];
    start_zones:          any[];
    traps:                Trap[];
    zone_points:          any[];
    incoming_zone_points: any[];
}

function InitZoneDataState(): IZoneDataState
{
    return {
        info:                 null,
        blocked_spells:       [],
        doors:                [],
        incoming_doors:       [],
        fishing:              [],
        forage:               [],
        grid:                 [],
        ground_spawns:        [],
        objects:              [],
        spawns:               [],
        start_zones:          [],
        traps:                [],
        zone_points:          [],
        incoming_zone_points: []
    }
}

export interface IZoneEditorReduxState
{
    options:         IOptionsState;
    zonelist:        IZoneListEntry[];
    zone_name:       string;
    zone:            IZoneDataState;
    selected_entity: EQEntity | null;
}

export const ZONE_EDITOR_INITIAL_STATE: IZoneEditorReduxState = {
    options: InitOptionsState(),
    zonelist: [],
    zone_name: 'necropolis',
    zone: InitZoneDataState(),
    selected_entity: null
}

export const ZoneEditorReducer: Reducer<IZoneEditorReduxState> = (state: IZoneEditorReduxState = ZONE_EDITOR_INITIAL_STATE, action: any) =>
{
    switch (action.type)
    {
        // Options
        case ACTION.SET_OPTIONS:          return { ...state, options: action.options };
        case ACTION.SET_SAFE_POINT:       return { ...state, options: { ...state.options, show_safe_point: action.show_safe_point }};
        case ACTION.SET_UNDERWORLD_PLANE: return { ...state, options: { ...state.options, show_underworld_plane: action.show_underworld_plane }};
        case ACTION.SET_DOORS:            return { ...state, options: { ...state.options, show_doors: action.show_doors }};
        case ACTION.SET_DOOR_LABELS:      return { ...state, options: { ...state.options, show_door_labels: action.show_door_labels }};
        case ACTION.SET_SPAWNS:           return { ...state, options: { ...state.options, show_spawns: action.show_spawns }};
        case ACTION.SET_SPAWN_LABELS:     return { ...state, options: { ...state.options, show_spawn_labels: action.show_spawn_labels }};
        case ACTION.SET_TRAPS:            return { ...state, options: { ...state.options, show_traps: action.show_traps }};
        case ACTION.SET_TRAP_LABELS:      return { ...state, options: { ...state.options, show_trap_labels: action.show_trap_labels }};
        // Zone Data
        case ACTION.SET_ZONELIST:         return { ...state, zonelist: action.zonelist };
        case ACTION.SET_ZONE_NAME:        return { ...state, zone_name: action.zone_name };
        case ACTION.SET_ZONE:             return { ...state, zone: action.zone };
        case ACTION.RESET_ZONE:           return { ...state, selected_entity: null, zone: InitZoneDataState() };
        // Entity
        case ACTION.SELECT_ENTITY:        return { ...state, selected_entity: action.selected_entity };
        case ACTION.CLEAR_ENTITY:         return { ...state, selected_entity: null };
        case ACTION.UPDATE_ENTITY:        return { ...state, selected_entity: { ...state.selected_entity, data: action.data }}
        // Door
        case ACTION.UPDATE_DOOR:
            return { ...state, zone: { ...state.zone, 
                doors: state.zone.doors.map(door => door.id === action.door.id ? { ...door, data: action.door } : door)
            }}
        case ACTION.DELETE_DOOR:
            return { ...state, zone: { ...state.zone, 
                doors: state.zone.doors.filter(door => door.id !== action.id)
            }}
        // Ground Spawn
        case ACTION.UPDATE_GROUNDSPAWN:
            return { ...state, zone: { ...state.zone, 
                ground_spawns: state.zone.ground_spawns.map(ground_spawn => ground_spawn.id === action.ground_spawn.id ? { ...ground_spawn, data: action.ground_spawn } : ground_spawn)
            }}
        case ACTION.DELETE_GROUNDSPAWN:
            return { ...state, zone: { ...state.zone, 
                ground_spawns: state.zone.ground_spawns.filter(ground_spawn => ground_spawn.id !== action.id)
            }}  
        // Spawn
        case ACTION.UPDATE_SPAWN:
            return { ...state, zone: { ...state.zone, 
                spawns: state.zone.spawns.map(spawn => spawn.id === action.spawn.id ? { ...spawn, data: action.spawn } : spawn)
            }}
        case ACTION.DELETE_SPAWN:
            return { ...state, zone: { ...state.zone, 
                spawns: state.zone.spawns.filter(spawn => spawn.id !== action.id)
            }}  
         // Spawn
        case ACTION.UPDATE_TRAP:
            return { ...state, zone: { ...state.zone, 
                traps: state.zone.traps.map(trap => trap.id === action.trap.id ? { ...trap, data: action.trap } : trap)
            }}
        case ACTION.DELETE_TRAP:
            return { ...state, zone: { ...state.zone, 
                traps: state.zone.traps.filter(trap => trap.id !== action.id)
            }}  
        case ACTION.RESET:                return ZONE_EDITOR_INITIAL_STATE;
        default:                          return state;
    }
}
