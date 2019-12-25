import { 
    combineReducers,
    createStore,
    Store
}                                               from 'redux';
import { devToolsEnhancer }                     from 'redux-devtools-extension/logOnlyInProduction';
import { reducer as FormReducer, FormStateMap } from 'redux-form';
import { ZoneEditor_reducer, IZoneEditorReduxState } from './reducer';

const store: Store<IZoneEditorReduxState> = createStore(
    ZoneEditor_reducer,
    devToolsEnhancer({
        name: 'EQLab'
    })
);

export default store;
