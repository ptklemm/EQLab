import React                              from 'react';
import {
    Row,
    Col,
    Form,
    Accordion,
    Card,
    Button
}                                         from 'react-bootstrap';
import { connect }                        from 'react-redux';
import {
    reduxForm,
    InjectedFormProps,
    formValueSelector,
    Field,
    FormSection,
    FieldArray
}                                          from 'redux-form';
import { diff }                            from 'deep-object-diff';
import { CCol, Checkbox, HInput, HSelect } from '../../common/Form';
import { ISpawnData, EQEntity }            from '../entity/Entity';
import { DESPAWN_TYPES }                   from '../../../common/constants';

interface ICustomProps
{
    style: React.CSSProperties;
    entityType: string;
    entityID: number;
    saveForm: (entity_type: string, data: any) => void;
    resetForm: () => void;
    closeForm: () => void;
    handleXChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleYChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleZChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleHeadingChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    spawngroupExpanded: boolean;
    toggleSpawngroupExpanded: () => void;
    showRoamCylinder: boolean;
    toggleRoamCylinder: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRoamDistanceChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    showRoamBox: boolean;
    toggleRoamBox: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRoamLimitsChange: (min_x: number, max_x: number, min_y: number, max_y: number) => void;
}

const selector = formValueSelector("Spawn");

interface IMapStateProps
{
    min_x: number;
    max_x: number;
    min_y: number;
    max_y: number;
}

const mapStateToProps = (state): IMapStateProps => ({
    min_x: selector(state, 'spawngroup.min_x'),
    max_x: selector(state, 'spawngroup.max_x'),
    min_y: selector(state, 'spawngroup.min_y'),
    max_y: selector(state, 'spawngroup.max_y')
});

type IProps = ICustomProps & IMapStateProps;
type ISpawnFormProps = IProps & InjectedFormProps<ISpawnData, IProps>;

class SpawnForm extends React.Component<ISpawnFormProps>
{
    constructor(props: ISpawnFormProps)
    {
        super(props);

        this.HandleRoamLimitsChange = this.HandleRoamLimitsChange.bind(this);
        this.SubmitForm = this.SubmitForm.bind(this);
    }

    private HandleRoamLimitsChange(event: any): void
    {
        const value = Number(event.target.value);
        const min_x = Number(this.props.min_x);
        const max_x = Number(this.props.max_x);
        const min_y = Number(this.props.min_y);
        const max_y = Number(this.props.max_y);

        switch (event.target.id)
        {
            case 'min_x':
                this.props.handleRoamLimitsChange(value, max_x, min_y, max_y);
                break;
            case 'max_x':
                this.props.handleRoamLimitsChange(min_x, value, min_y, max_y);
                break;
            case 'min_y':
                this.props.handleRoamLimitsChange(min_x, max_x, value, max_y);
                break;
            case 'max_y':
                this.props.handleRoamLimitsChange(min_x, max_x, min_y, value);
                break;
            default:
                break;
        }
    }

    private SubmitForm(values: ISpawnData, dispatch, props): Promise<void>
    {
        return new Promise((resolve, reject) => {
            const delta: any = diff(props.initialValues, values);

            let spawn_delta = { ...delta, id: values.id }
            let spawngroup_delta = null;

            // Attached spawngroup was changed
            if (spawn_delta.spawngroup)
            {
                spawngroup_delta = { ...spawn_delta.spawngroup, id: values.spawngroupID }
                delete spawn_delta.spawngroup;

                // ***todo check for changes in spawngroup.spawnentries/npcs
            }

            const data = {
                spawn: spawn_delta,
                spawngroup: spawngroup_delta
            }

            this.props.saveForm(EQEntity.TYPE_SPAWN, data);
            // Validate
            // let error_found = false;
            // const errors: { system_log_filepaths?: string, script_log_filepaths?: string } = {};

            // if (!values.system_log_filepaths.length)
            // {
            //     error_found = true;
            //     errors.system_log_filepaths = 'You must choose at least one system log.';
            // }

            // if (values.parse_script_logs && !values.script_log_filepaths.length)
            // {
            //     error_found = true;
            //     errors.script_log_filepaths = 'You must choose at least one script log.';
            // }

            // if (error_found)
            // {
            //     throw new SubmissionError(errors);
            // }

            setTimeout(() => {
                console.log('success! resolving promise');
                resolve();
            }, 2000)
        });
    }

    public render(): JSX.Element
    {
        return (
            <Form id="SpawnForm" noValidate autoComplete="off" spellCheck={false} onSubmit={this.props.handleSubmit(this.SubmitForm)}>
                <Card style={this.props.style}>
                    <Card.Header style={{ padding: 5, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{this.props.entityType}: {this.props.entityID}</span>
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={this.props.closeForm}
                        >
                            X
                        </Button>
                    </Card.Header>
                    <Card.Body style={{ padding: 0 }}>
                        <div style={{ padding: 5 }}>
                            <Row>
                                <Field disabled component={HInput} col={2} name="id" label="ID" />
                                <Field disabled component={HInput} col={4} name="zone" label="Zone" />
                                <Field component={HInput} col={3} type="number" name="version" label="Version" />
                                <CCol md={3}>
                                    <Field component={Checkbox} name="enabled" label="Enabled" />
                                </CCol>
                            </Row>
                            <Row>
                                <Col md={3}>
                                    <fieldset className="border">
                                    <legend>Misc</legend>
                                        <Row>
                                            <Field component={HInput} type="number" name="_condition" label="Condition" />
                                        </Row>
                                        <Row>
                                            <Field component={HInput} type="number" name="cond_value" label="Con.Value" />
                                        </Row>
                                        <Row>
                                            <Field component={HInput} type="number" name="animation" label="Animation" />
                                        </Row>
                                    </fieldset>
                                </Col>
                                <Col md={3}>
                                    <fieldset className="border">
                                    <legend>Respawn</legend>
                                        <Row>
                                            <Field component={HInput} type="number" name="respawntime" label="Respawn" />
                                        </Row>
                                        <Row>
                                            <Field component={HInput} type="number" name="variance" label="Variance" />
                                        </Row>
                                    </fieldset>
                                </Col>
                                <Col md={6}>
                                    <fieldset className="border">
                                    <legend>Position</legend>
                                        <Row>
                                            <Field
                                                component={HInput}
                                                type="number"
                                                name="heading"
                                                label="Heading"
                                                min={0}
                                                max={512}
                                                normalize={val => {
                                                    let heading = Number(val);
                                                    if (heading < 0)
                                                        return heading + 512;
                                        
                                                    if (heading > 512)
                                                        return heading - 512;

                                                    return heading;
                                                }}
                                                onChange={this.props.handleHeadingChange}
                                            />
                                            <Field component={HInput} type="number" name="x" label="X" onChange={this.props.handleXChange} />
                                        </Row>
                                        <Row>
                                            <Field component={HInput} type="number" name="pathgrid" label="Pathgrid" />
                                            <Field component={HInput} type="number" name="y" label="Y" onChange={this.props.handleYChange} />
                                        </Row>
                                        <Row>
                                            <Col md={6} />
                                            <Field component={HInput} type="number" name="z" label="Z" onChange={this.props.handleZChange} />
                                        </Row>
                                    </fieldset>
                                </Col>
                            </Row>
                        </div>
                        <Accordion activeKey={this.props.spawngroupExpanded ? "0" : ""}>
                            <Card style={{ borderRight: 'none', borderLeft: 'none', borderBottom: 'none' }}>
                                <Card.Header>
                                    <Row>
                                        <Col md={1}>
                                            <Accordion.Toggle
                                                as={Button}
                                                size="sm"
                                                variant="link"
                                                eventKey="0"
                                                onClick={this.props.toggleSpawngroupExpanded}
                                            >
                                            {this.props.spawngroupExpanded ? "Collapse" : "Expand"}
                                            </Accordion.Toggle>
                                        </Col>
                                        <Field disabled component={HInput} col={3} name="spawngroupID" label="SG ID" />
                                        <Field component={HInput} col={5} name="spawngroup.name" label="Spawngroup" />
                                        <Field component={HInput} col={3} type="number" name="spawngroup.spawn_limit" label="Limit" />
                                    </Row>
                                </Card.Header>
                                <Accordion.Collapse eventKey="0">
                                    <Card.Body style={{ padding: 5 }}>
                                            <Row>
                                                <Col md={4}>
                                                    <fieldset className="border">
                                                    <legend>Despawn</legend>
                                                        <Row>
                                                            <Field component={HSelect} options={DESPAWN_TYPES} name="spawngroup.despawn" label="Type" />
                                                        </Row>
                                                        <Row>
                                                            <Field component={HInput} type="number" name="spawngroup.despawn_timer" label="Timer" />
                                                        </Row>
                                                    </fieldset>
                                                </Col>
                                                <Col>
                                                    <fieldset className="border">
                                                    <legend>Roam</legend>
                                                        <Row>
                                                            <Field component={HInput} type="number" name="spawngroup.delay" label="Delay" />
                                                            <Field
                                                                component={HInput}
                                                                type="number"
                                                                name="spawngroup.dist"
                                                                label="Distance"
                                                                onChange={this.props.handleRoamDistanceChange}
                                                            />
                                                            <Col md={4} />
                                                        </Row>
                                                        <Row>
                                                            <Field component={HInput} type="number" name="spawngroup.mindelay" label="MinDelay" />
                                                            <Field
                                                                component={HInput}
                                                                type="number"
                                                                id="min_x"
                                                                name="spawngroup.min_x"
                                                                label="Min X"
                                                                onChange={this.HandleRoamLimitsChange}
                                                            />
                                                            <Field
                                                                component={HInput}
                                                                id="max_x"
                                                                type="number"
                                                                name="spawngroup.max_x"
                                                                label="Max X"
                                                                onChange={this.HandleRoamLimitsChange}
                                                            />
                                                        </Row>
                                                        <Row>
                                                            <Col md={4} />
                                                            <Field 
                                                                component={HInput}
                                                                type="number"
                                                                id="min_y"
                                                                name="spawngroup.min_y"
                                                                label="Min Y"
                                                                onChange={this.HandleRoamLimitsChange}
                                                            />
                                                            <Field
                                                                component={HInput}
                                                                type="number"
                                                                id="max_y"
                                                                name="spawngroup.max_y"
                                                                label="Max Y"
                                                                onChange={this.HandleRoamLimitsChange}
                                                            />
                                                        </Row>
                                                    </fieldset>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col>
                                                    <fieldset className="border" style={{ padding: 0 }}>
                                                    <legend>Spawn Entries</legend>
                                                        <FieldArray name="spawngroup.spawnentries" component={SpawnEntriesTable} />
                                                    </fieldset>
                                                </Col>
                                            </Row>
                                    </Card.Body>
                                </Accordion.Collapse>
                            </Card>
                        </Accordion>
                    </Card.Body>
                    <Card.Footer style={{ padding: 5, display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <Form.Check
                                inline
                                type="checkbox"
                                label="Show Roam Distance"
                                checked={this.props.showRoamCylinder}
                                onChange={this.props.toggleRoamCylinder}
                            />
                            <Form.Check
                                inline
                                type="checkbox"
                                label="Show Roam Limits"
                                checked={this.props.showRoamBox}
                                onChange={this.props.toggleRoamBox}
                            />
                        </div>
                        <div>
                            <Button
                                size="sm"
                                variant="warning"
                                disabled={this.props.pristine}
                                onClick={this.props.resetForm}
                            >
                                Reset
                            </Button>
                            <Button
                                style={{ marginLeft: 5, marginRight: 5}}
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
                        </div>
                    </Card.Footer>
                </Card>
            </Form>
        );
    }
}

// reduxForm<IFORMSTATE, ICUSTOMPROPS>(form_options)(Component)
export default connect<IMapStateProps, {}, {}>(
    mapStateToProps
)(reduxForm<ISpawnData, IProps>({
    form: "Spawn",
    enableReinitialize: true
})(SpawnForm));

const TdField = ({ input }) => <td>{input.value}</td>;

const SpawnEntriesTable = ({ fields }) => (
    <table className="eqlab-table">
        <thead>
            <tr>
                <th>NPC ID</th>
                <th>Name</th>
                <th>Level</th>
                <th>Max Level</th>
                <th>Chance</th>
                <th>Aggro</th>
                <th>Assist</th>
            </tr>
        </thead>
        <tbody>
        {
            fields.map((entry, i) => {
                return (
                    <tr key={i}>
                        <Field component={TdField} name={`${entry}.npc.id`} />
                        <Field component={TdField} name={`${entry}.npc.name`} />
                        <Field component={TdField} name={`${entry}.npc.level`} />
                        <Field component={TdField} name={`${entry}.npc.maxlevel`} />
                        <Field component={TdField} name={`${entry}.chance`} />
                        <Field component={TdField} name={`${entry}.npc.aggroradius`} />
                        <Field component={TdField} name={`${entry}.npc.assistradius`} />
                    </tr>
                );
            })
        }
        </tbody>
    </table>
);
