import { Reducer }      from 'redux';
import {
    SET_ZONE
} from './actions';
// import { Entity } from '../views/ZoneEditor/entities/Entity';

export interface IZoneEditorState
{
    readonly zone: string;
}

const INITIAL_STATE: IZoneEditorState = {
    zone: ''
}

export const ZoneEditor_reducer: Reducer<IZoneEditorState> = (state: IZoneEditorState = INITIAL_STATE, action: any) =>
{
    switch (action.type)
    {
        case SET_ZONE: return { ...state, zone: action.zone };
        default:       return state;
    }
}
