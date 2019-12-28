import { 
    combineReducers,
    createStore,
    Reducer,
    Store
}                                               from 'redux';
import { devToolsEnhancer }                     from 'redux-devtools-extension/logOnlyInProduction';
import { reducer as FormReducer, FormStateMap } from 'redux-form';
import { ZoneEditorReducer, IZoneEditorReduxState } from './reducer';

export interface IReduxState
{
    zone_editor: IZoneEditorReduxState;
    form: FormStateMap;
}

const reducer: Reducer<IReduxState>= combineReducers({
    zone_editor: ZoneEditorReducer,
    form: FormReducer
});

const store: Store<IReduxState> = createStore(
    reducer,
    devToolsEnhancer({
        name: 'EQLab',
        // Filter out Redux-Form actions
        predicate: (state, action) => action.type.startsWith('@@redux-form') ? false : true
    })
);

export default store;
