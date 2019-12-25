import React              from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { debounce }       from 'lodash';
import { IOptionsState }  from '../../redux/reducer';
import Slider, { Range }  from 'rc-slider';

interface IProps
{
    options: IOptionsState;
    sceneLoaded: boolean;
    changeCameraSpeed: (value: number) => void;
    changeClipPlanes: (values: number[]) => void;
    changeLightIntensity: (value: number) => void;
    toggleInvisibleWalls: (event: React.ChangeEvent<HTMLInputElement>) => void;
    toggleSafePoint: (event: React.ChangeEvent<HTMLInputElement>) => void;
    toggleUnderworldPlane: (event: React.ChangeEvent<HTMLInputElement>) => void;
    toggleWireframe: (event: React.ChangeEvent<HTMLInputElement>) => void;
    toggleBoundingBoxes: (event: React.ChangeEvent<HTMLInputElement>) => void;
    toggleFacetNormals: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

class OptionsPane extends React.Component<IProps>
{
    public render(): JSX.Element
    {
        return (
            <Form style={{ paddingLeft: 5, paddingRight: 15 }}>
                <Form.Group as={Row}>
                    <Form.Label column md={4}>Camera Speed</Form.Label>
                    <Col md={8}>
                        <Slider
                            style={{ marginTop: 10 }}
                            disabled={!this.props.sceneLoaded}
                            min={5}
                            max={800}
                            value={this.props.options.camera_speed}
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
                            min={this.props.options.clip_bottom}
                            max={this.props.options.clip_top}
                            defaultValue={[this.props.options.clip_bottom, this.props.options.clip_top]}
                            allowCross={false}
                            onChange={this.props.changeClipPlanes}
                        />
                    </Col>
                </Form.Group>
                {/* <Form.Group as={Row}>
                    <Form.Label column md={4}>Ambient Light</Form.Label>
                    <Col md={8}>
                        <Slider
                            style={{ marginTop: 10 }}
                            disabled={!this.props.sceneLoaded}
                            min={0}
                            max={100}
                            value={this.props.options.light_intensity}
                            onChange={this.props.changeLightIntensity}
                        />
                    </Col>
                </Form.Group> */}
                <Form.Check
                    type="checkbox"
                    label="Invisible Walls"
                    disabled={!this.props.sceneLoaded}
                    checked={this.props.options.show_invisible_walls}
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
                {/* <Form.Check
                    inline
                    type="checkbox"
                    label="Show Wireframe"
                    disabled={!this.props.sceneLoaded}
                    checked={this.props.options.show_wireframe}
                    onChange={this.props.toggleWireframe}
                />
                <Form.Check
                    inline
                    type="checkbox"
                    label="Show Bounding Boxes"
                    disabled={!this.props.sceneLoaded}
                    checked={this.props.options.show_bounding_boxes}
                    onChange={this.props.toggleBoundingBoxes}
                />
                <Form.Check
                    inline
                    type="checkbox"
                    label="Show Facet Normals"
                    disabled={!this.props.sceneLoaded}
                    checked={this.props.options.show_facet_normals}
                    onChange={this.props.toggleFacetNormals}
                /> */}
            </Form>
        );
    }
}

export default OptionsPane;
