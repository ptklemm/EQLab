import React        from 'react';
import {
    HashRouter,
    Switch,
    Route
}                   from "react-router-dom";
import { Provider } from 'react-redux';
import store        from '../redux/store';
import ZoneEditor   from './ZoneEditor/ZoneEditor';

export default class ViewManager extends React.Component
{
    render()
    {
        return (
            <Provider store={store}>
                <HashRouter>
                    <Switch>
                        <Route path="/zone_editor" render={() => <ZoneEditor />} />
                    </Switch>
                </HashRouter>
            </Provider>
        );
    }
}