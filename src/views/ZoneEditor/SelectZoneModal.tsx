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


const SelectZoneModal = (props: IProps) =>
{
    const [selected_zone, setZone] = React.useState('');

    const columns = React.useMemo(() => [{
        Header: 'Zone',
        accessor: 'long_name'
    }, {
        Header: 'Short Name',
        accessor: 'short_name'
    }, {
        Header: 'Expansion',
        accessor: 'expansion'
    }], []);

    // const data = React.useMemo(() => { return props.zonelist }, []);

    // console.log(data);

    return (
        <Modal 
            animation={false} 
            size="lg"
            backdrop="static"
            centered
            scrollable
            keyboard={false}
            show={props.selectingZone}
            onHide={props.close}
        >
            <Modal.Header closeButton>
                <Modal.Title>Select Zone</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Table
                    columns={columns}
                    data={props.zonelist}
                />
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between">
                <Button className="d-flex align-items-center" variant="warning" onClick={props.close}>
                    Cancel
                </Button>
                <Button className="d-flex align-items-center" onClick={() => props.selectZone(selected_zone)}>
                    Open
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default SelectZoneModal;
