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
import { IGroundSpawnData, EQEntity }      from '../entity/Entity';

interface ICustomProps
{
    style: React.CSSProperties;
    entityType: string;
    entityID: number;
    saveForm:  (entity_type: string, data: any) => Promise<[boolean, string?]>;
    deleteForm: () => void;
    resetForm: () => void;
    closeForm: () => void;
    handleHeadingChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

type IGroundSpawnFormProps = ICustomProps & InjectedFormProps<IGroundSpawnData, ICustomProps>;

class GroundSpawnForm extends React.Component<IGroundSpawnFormProps>
{
    constructor(props: IGroundSpawnFormProps)
    {
        super(props);

        this.SubmitForm = this.SubmitForm.bind(this);
    }

    private SubmitForm(values: IGroundSpawnData, dispatch, props): Promise<void>
    {
        return new Promise(async (resolve, reject) => {
            const delta: any = diff(props.initialValues, values);

            const data = { ...delta, id: values.id };

            const [save_succeeded, save_error] = await this.props.saveForm(EQEntity.TYPE_GROUNDSPAWN, data);
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
            <Form id="GroundSpawnForm" noValidate autoComplete="off" spellCheck={false} onSubmit={this.props.handleSubmit(this.SubmitForm)}>
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
                            <Field disabled component={HInput} name="zoneid" label="Zone ID" />
                            <Field component={HInput} name="name" label="Name" />
                            <Field component={HInput} type="number" name="version" label="Version" />
                        </Row>
                        <Row>
                            <Col md={6}>
                                <fieldset className="border">
                                <legend>Item</legend>
                                    <Row>
                                        <Field component={HInput} type="number" name="item" label="ID" />
                                        <Field component={HInput} name="item_name" label="Name" />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} type="number" name="max_allowed" label="Max Allowed" />
                                        <Field component={HInput} type="number" name="respawn_timer" label="Respawn" />
                                    </Row>
                                    <Row>
                                        <Field component={HInput} name="comment" label="Comment" />
                                    </Row>
                                </fieldset>
                            </Col>
                            <Col>
                                <fieldset className="border">
                                <legend>Position</legend>
                                    <Row>
                                        <Field component={HInput} type="number" name="heading" label="Heading" onChange={this.props.handleHeadingChange} />
                                        <Field component={HInput} type="number" name="min_x" label="Min X" />
                                        <Field component={HInput} type="number" name="max_x" label="Max X" />
                                    </Row>
                                    <Row>
                                        <Col />
                                        <Field component={HInput} type="number" name="min_y" label="Min Y" />
                                        <Field component={HInput} type="number" name="max_y" label="Max Y" />
                                    </Row>
                                    <Row>
                                        <Col />
                                        <Col />
                                        <Field component={HInput} type="number" name="max_z" label="Max Z" />
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

export default reduxForm<IGroundSpawnData, ICustomProps>({
    form: EQEntity.TYPE_GROUNDSPAWN,
    enableReinitialize: true
})(GroundSpawnForm);
