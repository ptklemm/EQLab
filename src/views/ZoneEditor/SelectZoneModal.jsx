import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import ReactTable     from 'react-table-v6';

export default class SelectZoneModal extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            selectedZone: null
        }

        this.SelectZone = this.SelectZone.bind(this);

        this.columns = [{
            Header: 'Zone',
            accessor: 'long_name'
        },{
            Header: 'Short Name',
            accessor: 'short_name'
        }, {
            Header: 'Expansion',
            accessor: 'expansion'
        }];
    }

    SelectZone()
    {
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
                    <ReactTable
                        data={this.props.zonelist}
                        columns={this.columns}
                        showPagination={false}
                        defaultPageSize={this.props.zonelist.length}
                        filterable={true}
                        getTrProps={(state, row) => {
                            return {style: {
                                cursor: 'pointer',
                                background: row.original.short_name === this.state.selectedZone && 'green'
                            }}
                        }}
                        getTdProps={(state, row) => {
                            return {
                                onClick: (e, handleOriginal) => {
                                    if (handleOriginal)
                                        handleOriginal();

                                    this.setState({ selectedZone: row.original.short_name });
                                },
                                onDoubleClick: (e, handleOriginal) => {
                                    if (handleOriginal)
                                        handleOriginal();

                                    this.SelectZone(row.original.short_name);
                                }
                            }
                        }}
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
