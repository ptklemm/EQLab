import React           from 'react';
import {
    HashRouter,
    Switch,
    Route
}                      from "react-router-dom";
// import { Provider }    from 'react-redux';
// import { main_window_store } from '../redux/store';
import MainWindow      from './MainWindow/MainWindow';

export default class ViewManager extends React.Component
{
    render()
    {
        return (
            <HashRouter>
                <Switch>
                    <Route path="/main" render={() => <MainWindow />} />
                    {/* <Route path="/advanced" render={() => <Provider store={advanced_options_store}><AdvancedOptions /></Provider>} /> */}
                </Switch>
            </HashRouter>
        );
    }
}