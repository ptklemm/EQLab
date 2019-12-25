import { Reducer } from 'redux';
import * as ACTION from './actions';
import {
    Spawn
} from '../views/ZoneEditor/entity/Entity';

export interface IOptionsState
{
    camera_speed:          number;
    light_intensity:       number;
    clip_top:              number;
    clip_bottom:           number;
    show_invisible_walls:  boolean;
    show_safe_point:       boolean;
    show_underworld_plane: boolean;
    show_wireframe:        boolean;
    show_bounding_boxes:   boolean;
    show_axis:             boolean;
    show_facet_normals:    boolean;
}

function InitOptionsState(): IOptionsState
{
    return {
        camera_speed:          100,
        light_intensity:       100,
        clip_top:              10000,
        clip_bottom:           -10000,
        show_invisible_walls:  true,
        show_safe_point:       true,
        show_underworld_plane: true,
        show_wireframe:        false,
        show_bounding_boxes:   false,
        show_axis:             false,
        show_facet_normals:    false
    }
}

export interface IZoneDataState
{
    info:                 any;
    zone_points:          any[];
    incoming_zone_points: any[];
    start_zones:          any[];
    blocked_spells:       any[];
    doors:                any[];
    incoming_doors:       any[];
    fishing:              any[];
    forage:               any[];
    grid:                 any[];
    ground_spawns:        any[];
    objects:              any[];
    spawns:               Spawn[];
    traps:                any[];
}

function InitZoneDataState(): IZoneDataState
{
    return {
        info:                 null,
        zone_points:          [],
        incoming_zone_points: [],
        start_zones:          [],
        blocked_spells:       [],
        doors:                [],
        incoming_doors:       [],
        fishing:              [],
        forage:               [],
        grid:                 [],
        ground_spawns:        [],
        objects:              [],
        spawns:               [],
        traps:                []
    }
}

export interface IZoneEditorReduxState
{
    options:         IOptionsState;
    zonelist:        any[];
    zone_name:       string | null;
    zone:            IZoneDataState;
    selected_entity: any;
}

export const ZONE_EDITOR_INITIAL_STATE: IZoneEditorReduxState = {
    options: InitOptionsState(),
    zonelist: [],
    zone_name: 'airplane',
    zone: InitZoneDataState(),
    selected_entity: null
}

export const ZoneEditor_reducer: Reducer<IZoneEditorReduxState> = (state: IZoneEditorReduxState = ZONE_EDITOR_INITIAL_STATE, action: any) =>
{
    switch (action.type)
    {
        case ACTION.SET_OPTIONS:          return { ...state, options: action.options}
        case ACTION.SET_CAMERA_SPEED:     return { ...state, options: { ...state.options, camera_speed: action.camera_speed }}
        case ACTION.SET_CLIP_PLANES:      return { ...state, options: { ...state.options, clip_bottom: action.clip_bottom, clip_top: action.clip_top }}
        case ACTION.SET_CLIP_PLANES:      return { ...state, options: { ...state.options, light_intensity: action.light_intensity }}
        case ACTION.SET_INVISIBLE_WALLS:  return { ...state, options: { ...state.options, show_invisible_walls: action.show_invisible_walls }}
        case ACTION.SET_SAFE_POINT:       return { ...state, options: { ...state.options, show_safe_point: action.show_safe_point }}
        case ACTION.SET_UNDERWORLD_PLANE: return { ...state, options: { ...state.options, show_underworld_plane: action.show_underworld_plane }}
        case ACTION.SET_WIREFRAME:        return { ...state, options: { ...state.options, show_wireframe: action.show_wireframe }}
        case ACTION.SET_BOUNDING_BOXES:   return { ...state, options: { ...state.options, show_bounding_boxes: action.show_bounding_boxes }}
        case ACTION.SET_FACET_NORMALS:    return { ...state, options: { ...state.options, show_facet_normals: action.show_facet_normals }}
        case ACTION.SET_ZONELIST:         return { ...state, zonelist: action.zonelist ? action.zonelist : state.zonelist };
        case ACTION.SET_ZONE_NAME:        return { ...state, zone_name: action.zone_name ? action.zone_name : state.zone_name };
        case ACTION.SET_ZONE:             return { ...state, zone: action.zone ? action.zone : state.zone };
        case ACTION.RESET:                return ZONE_EDITOR_INITIAL_STATE;
        default:                          return state;
    }
}
