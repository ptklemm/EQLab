import { createStore, Store } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension/logOnlyInProduction';
import { ZoneEditor_reducer, IZoneEditorState }         from './reducer';
// import { reducer as formReducer, FormStateMap }         from 'redux-form';

/*-------------- Store --------------------*/

const store: Store<IZoneEditorState> = createStore(
    ZoneEditor_reducer,
    devToolsEnhancer({
        name: "EQLab"
    })
);

export { 
    store
}
