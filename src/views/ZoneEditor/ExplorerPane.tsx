import React from 'react';
import { IZoneDataState } from '../../redux/reducer';
import Table from '../common/Table';

interface IProps
{
    zone: IZoneDataState;
}

const ExplorerPane = (props: IProps) =>
{
    const columns = React.useMemo(() => [{
        Header: 'ID',
        accessor: 'id'
    }, {
        Header: 'Spawngroup',
        accessor: 'data.spawngroup.name'
    }], []);

    return (
        <div id="ExplorerPane">
            <Table
                columns={columns}
                data={props.zone.spawns}
            />
        </div>
    );
}

export default ExplorerPane;
