import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import Table     from '../common/Table';

interface IProps
{
    selectingZone: boolean;
    close: () => void;
    zonelist: any[];
    selectZone: (zone_short_name: string) => void;
}

interface IState
{
    selectedZone: string | null;
}

export default class SelectZoneModal extends React.Component<IProps, IState>
{
    private columns: any[];

    constructor(props: IProps)
    {
        super(props);
        this.state = {
            selectedZone: null
        }

        this.SelectZone = this.SelectZone.bind(this);

        this.columns = React.useMemo(() => [{
            Header: 'Zone',
            accessor: 'long_name'
        },{
            Header: 'Short Name',
            accessor: 'short_name'
        }, {
            Header: 'Expansion',
            accessor: 'expansion'
        }], []);
    }

    SelectZone()
    {
        if (this.state.selectedZone)
            this.props.selectZone(this.state.selectedZone);
    }

    render()
    {
        return (
            <Modal 
                animation={false} 
                size="lg"
                backdrop="static"
                centered
                scrollable
                keyboard={false}
                show={this.props.selectingZone}
                onHide={this.props.close}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Select Zone</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table
                        columns={this.columns}
                        data={React.useMemo(() => this.props.zonelist, [])}
                    />
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <Button className="d-flex align-items-center" variant="warning" onClick={this.props.close}>
                        Cancel
                    </Button>
                    <Button className="d-flex align-items-center" onClick={this.SelectZone}>
                        Open
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
