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
import { ITrapData, EQEntity }             from '../entity/Entity';
import { TRAP_TYPES }                      from '../../../common/constants';

interface ICustomProps
{
    style:                   React.CSSProperties;
    entityType:              string;
    entityID:                number;
    saveForm:                (entity_type: string, data: any) => Promise<[boolean, string?]>;
    deleteForm:              () => void;
    resetForm:               () => void;
    closeForm:               () => void;
    handleXChange:           (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleYChange:           (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleZChange:           (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRadiusChange:      (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleZDifferenceChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

type ITrapFormProps = ICustomProps & InjectedFormProps<ITrapData, ICustomProps>;

class TrapForm extends React.Component<ITrapFormProps>
{
    constructor(props: ITrapFormProps)
    {
        super(props);

        this.SubmitForm = this.SubmitForm.bind(this);
    }

    private SubmitForm(values: ITrapData, dispatch, props): Promise<void>
    {
        return new Promise(async (resolve, reject) => {
            const delta: any = diff(props.initialValues, values);

            const data = { ...delta, id: values.id };

            const [save_succeeded, save_error] = await this.props.saveForm(EQEntity.TYPE_TRAP, data);
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
            <Form id="TrapForm" noValidate autoComplete="off" spellCheck={false} onSubmit={this.props.handleSubmit(this.SubmitForm)}>
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
                            <Field disabled component={HInput} name="zone" label="Zone" />
                            <Field component={HInput} type="number" name="version" label="Version" />
                            <Col />
                        </Row>
                        <Row>
                            <Col md={6}>
                                <fieldset className="border">
                                <legend>Effect</legend>
                                    <Row>
                                        <Field component={HSelect} options={TRAP_TYPES} name="effect" label="Type" />
                                        <Field component={HInput} name="message" label="Message" />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="effectvalue" label="Value" />
                                        <Field component={HInput} type="number" name="effectvalue2" label="Value2" />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="level" label="Level" />
                                        <Field component={HInput} type="number" name="skill" label="Disarm" />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="chance" label="Chance" />
                                        <Col><Field component={Checkbox} name="undetectable" label="Undetectable" /></Col>
                                    </Row>
                                </fieldset>
                            </Col>
                            <Col>
                                <fieldset className="border">
                                <legend>Position</legend>
                                    <Row>
                                        <Field component={HInput} type="number" name="radius" label="Radius" onChange={this.props.handleRadiusChange} />
                                        <Field component={HInput} type="number" name="x" label="X" onChange={this.props.handleXChange} />
                                    </Row>
                                    <Row>
                                        <Col />
                                        <Field component={HInput} type="number" name="y" label="Y" onChange={this.props.handleYChange} />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="maxzdiff" label="Max Z Diff" onChange={this.props.handleZDifferenceChange} />
                                        <Field component={HInput} type="number" name="z" label="Z" onChange={this.props.handleZChange} />
                                    </Row>
                                </fieldset>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <fieldset className="border">
                                <legend>Misc</legend>
                                    <Row>
                                        <Field component={HInput} type="number" name="triggered_number" label="Triggered Number" />
                                        <Field component={HInput} type="number" name="group" label="Group" />
                                    </Row>
                                </fieldset>
                            </Col>
                            <Col>
                                <fieldset className="border">
                                <legend>Spawn</legend>
                                    <Row>
                                        <Col><Field component={Checkbox} name="despawn_when_triggered" label="Despawn on Trigger" /></Col>
                                        <Field component={HInput} type="number" name="respawn_time" label="Respawn" />
                                    </Row>
                                    <Row>
                                        <Col />
                                        <Field component={HInput} type="number" name="respawn_var" label="Variance" />
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

export default reduxForm<ITrapData, ICustomProps>({
    form: EQEntity.TYPE_TRAP,
    enableReinitialize: true
})(TrapForm);
