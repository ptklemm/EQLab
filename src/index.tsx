import 'react-table-v6/react-table.css';
import 'react-splitter-layout/lib/index.css';
import './scss/index.scss';

import React from 'react';
import { render }  from 'react-dom';
import ViewManager from './views/ViewManager';

render(<ViewManager />, document.getElementById('index'));
