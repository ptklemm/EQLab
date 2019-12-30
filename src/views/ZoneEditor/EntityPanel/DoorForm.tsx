import React                              from 'react';
import {
    Row,
    Col,
    Form,
    Card,
    Button
}                                         from 'react-bootstrap';
import {
    reduxForm,
    InjectedFormProps,
    Field,
    SubmissionError
}                                          from 'redux-form';
import { diff }                            from 'deep-object-diff';
import { CCol, Checkbox, HInput, HSelect } from '../../common/Form';
import { IDoorData, EQEntity }            from '../entity/Entity';

interface ICustomProps
{
    style: React.CSSProperties;
    entityType: string;
    entityID: number;
    saveForm:  (entity_type: string, data: any) => Promise<[boolean, string?]>;
    deleteForm: () => void;
    resetForm: () => void;
    closeForm: () => void;
    handleXChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleYChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleZChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleHeadingChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

type IDoorFormProps = ICustomProps & InjectedFormProps<IDoorData, ICustomProps>;

class DoorForm extends React.Component<IDoorFormProps>
{
    constructor(props: IDoorFormProps)
    {
        super(props);

        this.SubmitForm = this.SubmitForm.bind(this);
    }

    private SubmitForm(values: IDoorData, dispatch, props): Promise<void>
    {
        return new Promise(async (resolve, reject) => {
            const delta: any = diff(props.initialValues, values);

            const data = { ...delta, id: values.id };

            const [save_succeeded, save_error] = await this.props.saveForm(EQEntity.TYPE_DOOR, data);
            if (!save_succeeded)
            {
                reject(new SubmissionError({ _error: save_error }));
                return;
            }
                
            resolve();
        });
    }

    public render(): JSX.Element
    {
        return (
            <Form id="DoorForm" noValidate autoComplete="off" spellCheck={false} onSubmit={this.props.handleSubmit(this.SubmitForm)}>
                <Card style={this.props.style}>
                    <Card.Header style={{ padding: 5, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{this.props.entityType}: {this.props.entityID}</span>
                        <span>{this.props.submitting ? "Saving..." : null}</span>
                        <span>{this.props.submitFailed && `Save Failed: ${this.props.error ? this.props.error : "Unknown"}`}</span>
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={this.props.closeForm}
                        >
                            X
                        </Button>
                    </Card.Header>
                    <Card.Body style={{ padding: 5 }}>
                        <Row>
                            <Field disabled component={HInput} name="id" label="ID" />
                            <Field disabled component={HInput} name="doorid" label="Door ID" />
                            <Field disabled component={HInput} name="zone" label="Zone" />
                            <Field disabled component={HInput} name="name" label="Name" />
                            <Field component={HInput} type="number" name="version" label="Version" />
                        </Row>
                        <Row>
                            <Col md={7}>
                                <fieldset className="border">
                                <legend>Open</legend>
                                    <Row>
                                        <Field component={HInput} type="number" name="opentype" label="Type" />
                                        <Field component={HInput} type="number" name="lockpick" label="Lockpick" />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="guild" label="Guild" />
                                        <Field component={HInput} type="number" name="keyitem" label="Key" />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="triggerdoor" label="Triggered" />
                                        <Col><Field component={Checkbox} name="nokeyring" label="No Keyring" /></Col>
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="triggertype" label="Trigger Type" />
                                        <Col><Field component={Checkbox} name="doorisopen" label="Is Open" /></Col>
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="door_param" label="Door Param" />
                                        <Field component={HInput} type="number" name="disable_timer" label="Timer" />
                                    </Row>
                                </fieldset>
                            </Col>
                            <Col>
                                <fieldset className="border">
                                <legend>Position</legend>
                                    <Row>
                                        <Field component={HInput} type="number" name="heading" label="Heading" onChange={this.props.handleHeadingChange} />
                                        <Field component={HInput} type="number" name="pos_x" label="X" onChange={this.props.handleXChange} />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="incline" label="Incline" />
                                        <Field component={HInput} type="number" name="pos_y" label="Y" onChange={this.props.handleYChange} />
                                    </Row>
                                    <Row>
                                        <Col />
                                        <Field component={HInput} type="number" name="pos_z" label="Z" onChange={this.props.handleZChange} />
                                    </Row>
                                </fieldset>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={7}>
                                <fieldset className="border">
                                <legend>Misc</legend>
                                    <Row>
                                        <Col><Field component={Checkbox} name="invert_state" label="Invert State" /></Col>
                                        <Col><Field component={Checkbox} name="is_ldon_door" label="LDoN Door" /></Col>
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="size" label="Size" />
                                        <Field component={HInput} type="number" name="buffer" label="Buffer" />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="client_version_mask" label="Client Mask" />
                                        <Col />
                                    </Row>
                                </fieldset>
                            </Col>
                            <Col>
                                <fieldset className="border">
                                <legend>Destination</legend>
                                    <Row>
                                        <Field component={HInput} name="dest_zone" label="Zone" />
                                        <Field component={HInput} type="number" name="dest_x" label="X" />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="dest_instance" label="Instance" />
                                        <Field component={HInput} type="number" name="dest_y" label="Y" />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="dest_heading" label="Heading" />
                                        <Field component={HInput} type="number" name="dest_z" label="Z" />
                                    </Row>
                                </fieldset>
                            </Col>
                        </Row>
                    </Card.Body>
                    <Card.Footer style={{ padding: 5, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            style={{ marginRight: 20}}
                            size="sm"
                            variant="danger"
                            onClick={this.props.deleteForm}
                        >
                            Delete
                        </Button>
                        <Button
                            style={{ marginRight: 5}}
                            size="sm"
                            variant="warning"
                            disabled={this.props.pristine}
                            onClick={this.props.resetForm}
                        >
                            Reset
                        </Button>
                        <Button
                            style={{ marginRight: 5}}
                            size="sm"
                            variant="primary"
                            disabled={this.props.pristine}
                            type="submit"
                        >
                            Apply
                        </Button>
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={this.props.closeForm}
                        >
                            Close
                        </Button>
                    </Card.Footer>
                </Card>
            </Form>
        );
    }
}

export default reduxForm<IDoorData, ICustomProps>({
    form: EQEntity.TYPE_DOOR,
    enableReinitialize: true
})(DoorForm);
