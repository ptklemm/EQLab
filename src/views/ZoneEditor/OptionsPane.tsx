import React              from 'react';
import { Row, Col, ListGroup, Tabs, Tab, Form } from 'react-bootstrap';
import SplitterLayout          from 'react-splitter-layout';
import { IOptionsState }  from '../../redux/reducer';
import Slider, { Range }  from 'rc-slider';

interface IProps
{
    sceneLoaded: boolean;
    cameraSpeed: number;
    changeCameraSpeed: (value: number) => void;
    clipTopInit: number;
    clipBottomInit: number;
    changeClipPlanes: (values: number[]) => void;
    lightIntensity: number;
    changeLightIntensity: (value: number) => void;
    showInvisibleWalls: boolean;
    toggleInvisibleWalls: (event: React.ChangeEvent<HTMLInputElement>) => void;
    options: IOptionsState;
    toggleSafePoint: (event: React.ChangeEvent<HTMLInputElement>) => void;
    toggleUnderworldPlane: (event: React.ChangeEvent<HTMLInputElement>) => void;
    objects: string[];
    toggleObject: (event: React.ChangeEvent<HTMLInputElement>) => void;
    materials: string[];
    toggleMaterial: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

class OptionsPane extends React.Component<IProps>
{
    public render(): JSX.Element
    {
        const { objects, materials } = this.props;

        return (
            <ListGroup variant="flush">
                <SplitterLayout vertical percentage={true} secondaryInitialSize={57}>
                    <ListGroup.Item style={{ paddingRight: 10 }}>
                        <Form.Group as={Row}>
                            <Form.Label column md={4}>Camera Speed</Form.Label>
                            <Col md={8}>
                                <Slider
                                    style={{ marginTop: 10 }}
                                    disabled={!this.props.sceneLoaded}
                                    min={5}
                                    max={800}
                                    value={this.props.cameraSpeed}
                                    onChange={this.props.changeCameraSpeed}
                                />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={4}>Clip Planes</Form.Label>
                            <Col md={8}>
                                <Range
                                    style={{ marginTop: 10 }}
                                    disabled={!this.props.sceneLoaded}
                                    min={this.props.clipBottomInit}
                                    max={this.props.clipTopInit}
                                    defaultValue={[this.props.clipBottomInit, this.props.clipTopInit]}
                                    allowCross={false}
                                    onChange={this.props.changeClipPlanes}
                                />
                            </Col>
                        </Form.Group>
                        <Form.Check
                            type="checkbox"
                            label="Invisible Walls"
                            disabled={!this.props.sceneLoaded}
                            checked={this.props.showInvisibleWalls}
                            onChange={this.props.toggleInvisibleWalls}
                        />
                        <Form.Check
                            type="checkbox"
                            label="Safe Point"
                            disabled={!this.props.sceneLoaded}
                            checked={this.props.options.show_safe_point}
                            onChange={this.props.toggleSafePoint}
                        />
                        <Form.Check
                            type="checkbox"
                            label="Underworld Plane"
                            disabled={!this.props.sceneLoaded}
                            checked={this.props.options.show_underworld_plane}
                            onChange={this.props.toggleUnderworldPlane}
                        />
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Tabs id="graphics-browser" defaultActiveKey="objects" transition={false}>
                            <Tab id="objects-tab" eventKey="objects" title="Objects">
                                <ListGroup style={{ overflowY: 'auto' }}>
                                    {objects.map((obj_name, i) =>
                                        <ListGroup.Item key={i}>
                                            <Form.Check
                                                defaultChecked
                                                id={obj_name}
                                                label={obj_name}
                                                onChange={this.props.toggleObject}
                                            />
                                        </ListGroup.Item>
                                    )}
                                </ListGroup>
                            </Tab>
                            <Tab id="materials-tab" eventKey="materials" title="Materials">
                                <ListGroup style={{ overflowY: 'auto' }}>
                                    {materials.map((mat_name, i) =>
                                        <ListGroup.Item key={i}>
                                            <Form.Check
                                                defaultChecked
                                                id={mat_name}
                                                label={mat_name}
                                                onChange={this.props.toggleMaterial}
                                            />
                                        </ListGroup.Item>
                                    )}
                                </ListGroup>
                            </Tab>
                        </Tabs>
                    </ListGroup.Item>
                </SplitterLayout>
            </ListGroup>
        );
    }
}

export default OptionsPane;
