import React                   from 'react';
import * as BABYLON            from 'babylonjs';
import * as BABYLONGUI         from 'babylonjs-gui';
import { connect }             from 'react-redux';
import SplitterLayout          from 'react-splitter-layout';
import DatabaseConnection      from '../../data/db';
import { IZoneEditorState }    from '../../redux/reducer';
import * as ACTION             from '../../redux/actions';

interface IProps
{
    DB: DatabaseConnection;
}

interface IMapState
{
    zone: string;
}

const mapStateToProps = (state: IZoneEditorState): IMapState => ({
    zone: state.zone
});

type IEditorProps = IProps & IMapState;

interface IState
{
    canvas_width: number;
    canvas_height: number;
}

class Editor extends React.Component<IEditorProps, IState>
{
    public DB: DatabaseConnection;
    private file_loader: any;
    private graphics_factory: any;
    private entity_factory: any;
    private entity_manager: any;

    private canvas: HTMLCanvasElement | null;
    private engine: BABYLON.Engine | null;
    private scene: BABYLON.Scene | null;
    private octree: any;
    private camera: any;
    private light: BABYLON.HemisphericLight | null;

    constructor(props: IEditorProps)
    {
        super(props);
        this.state = {
            canvas_width: window.innerWidth * 0.8,
            canvas_height: window.innerHeight
        }

        this.DB = props.DB;


        this.canvas = null;
        this.engine = null;
        this.scene = null;
        this.octree = null;
        this.camera = null;
        this.light = null;

        this.OnSecondaryPaneSizeChange = this.OnSecondaryPaneSizeChange.bind(this);
    }

    public async componentDidMount(): Promise<void>
    {
        this.engine = new BABYLON.Engine(this.canvas, true, { stencil: true });

        window.addEventListener('resize', this.HandleWindowResize.bind(this));

        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = BABYLON.Color4.FromHexString("#1E488FFF");
        this.scene.ambientColor = new BABYLON.Color3(1, 1, 1);

        this.camera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 0, -100), this.scene);
        this.camera.inputs.remove(this.camera.inputs.attached.gamepad);
        this.camera.inputs.remove(this.camera.inputs.attached.touch);
        this.camera.inputs.attached.mouse.buttons = [2];
        this.camera.keysUp = [87];
        this.camera.keysLeft = [65];
        this.camera.keysDown = [83];
        this.camera.keysRight = [68];
        this.camera.inertia = 0.1;
        this.camera.speed = 10;
        this.camera.maxZ = 50000;
        this.camera.angularSensibility = 200;
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.attachControl(this.canvas, true);
        this.scene.activeCamera = this.camera;

        this.light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        // this.light.ambient = new BABYLON.Color3(1, 1, 1);
        this.light.diffuse = new BABYLON.Color3(1, 1, 1);
        this.light.specular = new BABYLON.Color3(1, 1, 1);
        this.light.intensity = 1;

        let box = BABYLON.MeshBuilder.CreateBox("box", { size: 50 }, this.scene);

        this.scene.onPointerObservable.add((pointerInfo) => {
            const button = pointerInfo.event.button;

            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERTAP:
                    // if (button === 0) { this.handleMouseClick(pointerInfo.pickInfo); }
                    break;
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    if (button === 2) { this.canvas?.requestPointerLock(); }
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    //if (button === 0) { this.handleMouseClick(pointerInfo.pickInfo); }
                    if (button === 2) { document.exitPointerLock(); }
                    break;
                default:
                    break;
            }
        });

        const spawntree = await this.DB.Zone.FullSpawnTree('airplane');

        this.engine.runRenderLoop(() => {
            if (this.scene)
                this.scene.render();
        });

        // Fetch general zone data from DB
        // Initiate Scene
        // Load global PFS files -> Extract WLDs
        // Load zone PFS files -> Extract WLDs
        // Create graphics prototypes (global & zone WLDS -> GraphicsFactory)
        // Fetch entity lists from DB
        // Create entities -> EntityFactory
    }

    public componentDidUpdate(prevProps: IEditorProps): void
    {
        // Reinitialize if zone changed
    }

    public componentWillUnmount(): void
    {
        // Destroy everything except DB
    }

    private HandleWindowResize(event: UIEvent): void
    {
        this.setState({ canvas_width: window.innerWidth, canvas_height: window.innerHeight }, () => {
            this.engine?.resize();
        });
    }

    private OnSecondaryPaneSizeChange(width: number): void
    {
        this.setState({ canvas_width: width }, () => {
            this.engine?.resize();
        });
    }

    public render(): JSX.Element
    {
        return (
            <React.Fragment>
                <SplitterLayout
                    percentage={false}
                    secondaryMinSize={window.innerWidth * 0.5}
                    secondaryInitialSize={this.state.canvas_width}
                    onSecondaryPaneSizeChange={this.OnSecondaryPaneSizeChange}
                >
                    <div>Explorer Pane</div>
                    <div style={{ width: this.state.canvas_width, height: this.state.canvas_height }}>
                        <canvas 
                            id="ZoneEditorCanvas"
                            style={{ width: this.state.canvas_width, height: this.state.canvas_height }}
                            ref={(canvas) => {
                                if (canvas !== null) { this.canvas = canvas; }
                            }}
                        />
                    </div>
                </SplitterLayout>}
            </React.Fragment>
        );
    }
}

// export default Editor;

export default connect<IMapState, {}, {}, IZoneEditorState>(mapStateToProps)(Editor);
