import React                   from 'react';
import * as BABYLON            from 'babylonjs';
import * as GUI                from 'babylonjs-gui';
import { connect }             from 'react-redux';
import SplitterLayout          from 'react-splitter-layout';
import DatabaseConnection      from '../../data/db';
import { IZoneEditorState }    from '../../redux/reducer';
// import * as ACTION             from '../../redux/actions';
import FileLoader from './loaders/FileLoader';
import GraphicsFactory from './factories/GraphicsFactory';
import EntityManager from './entities/EntityManager';

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
    private canvas:              HTMLCanvasElement | null;
    private engine:              BABYLON.Engine | null;
    private scene:               BABYLON.Scene | null;
    private octree:              BABYLON.Octree<BABYLON.AbstractMesh> | null;
    private camera:              BABYLON.FreeCamera | null;
    private light:               BABYLON.HemisphericLight | null;
    private labels:              GUI.AdvancedDynamicTexture | null;
    private label_style:         GUI.Style | null;
    private position_gizmo:      BABYLON.PositionGizmo | null;
    private rotation_gizmo:      BABYLON.PlaneRotationGizmo | null;
    private highlight_layer:     BABYLON.HighlightLayer | null
    private distance_material:   BABYLON.StandardMaterial | null;
    private limits_material:     BABYLON.StandardMaterial | null;

    private DB:                  DatabaseConnection;
    private graphics_factory:    GraphicsFactory | null;
    private entity_manager:      EntityManager | null;

    private zone_model:          BABYLON.Mesh | null;
    private bounding_info:       BABYLON.BoundingInfo | null;
    private center:              BABYLON.Vector3 | null;
    private max:                 BABYLON.Vector3 | null;
    private min:                 BABYLON.Vector3 | null;
    private world_volume:        number | null;
    private default_mesh_length: number | null;
    
    constructor(props: IEditorProps)
    {
        super(props);
        this.state = {
            canvas_width: window.innerWidth * 0.8,
            canvas_height: window.innerHeight
        }

        this.canvas              = null;
        this.engine              = null;
        this.scene               = null;
        this.octree              = null;
        this.camera              = null;
        this.light               = null;
        this.labels              = null;
        this.label_style         = null;
        this.position_gizmo      = null;
        this.rotation_gizmo      = null;
        this.highlight_layer     = null;
        this.distance_material   = null;
        this.limits_material     = null;
        
        this.DB                  = props.DB;
        this.graphics_factory    = null;
        this.entity_manager      = null;

        this.zone_model          = null;
        this.bounding_info       = null;
        this.center              = null;
        this.max                 = null;
        this.min                 = null;
        this.world_volume        = null;
        this.default_mesh_length = null;

        this.OnSecondaryPaneSizeChange = this.OnSecondaryPaneSizeChange.bind(this);
    }

    public async componentDidMount(): Promise<void>
    {
        this.engine = new BABYLON.Engine(this.canvas, true, { stencil: true });

        window.addEventListener('resize', this.HandleWindowResize.bind(this));

        this.scene = await this.CreateScene(this.engine);

        this.engine.runRenderLoop(() => {
            if (this.scene)
                this.scene.render();
        });
    }

    public componentDidUpdate(prevProps: IEditorProps): void
    {

    }

    public componentWillUnmount(): void
    {
        this.scene?.dispose();
        this.engine?.dispose();
    }

    private ClearScene(): void
    {
        this.engine?.stopRenderLoop();
        this.scene?.dispose();

        // this.initializeProperties();
    }

    private async CreateScene(engine: BABYLON.Engine): Promise<BABYLON.Scene>
    {
        const scene                                  = new BABYLON.Scene(engine);
        scene.collisionsEnabled                      = false;
        scene.fogEnabled                             = false;
        scene.lensFlaresEnabled                      = false;
        scene.particlesEnabled                       = false;
        scene.postProcessesEnabled                   = false;
        scene.probesEnabled                          = false;
        scene.proceduralTexturesEnabled              = false;
        scene.shadowsEnabled                         = false;
        scene.spritesEnabled                         = false;
        scene.clearColor                             = BABYLON.Color4.FromHexString("#1E488FFF");
        scene.ambientColor                           = new BABYLON.Color3(1, 1, 1);
        scene.defaultMaterial.sideOrientation        = BABYLON.Material.ClockWiseSideOrientation;
        scene.forceWireframe                         = false;
        scene.getBoundingBoxRenderer().showBackLines = false;
        scene.forceShowBoundingBoxes                 = false;

        this.light  = this.CreateAmbientLight(scene);
        this.camera = this.CreateCamera(scene);

        this.CreateControls(this.canvas as HTMLCanvasElement, engine, scene);
        this.CreateLabels(scene);
        this.CreateGizmosAndHighlight(scene);
        this.CreateRoamMaterials(scene);

        this.graphics_factory = new GraphicsFactory(scene, new FileLoader('X:\\EQCLIENT'));
        this.entity_manager   = new EntityManager(scene, this.graphics_factory);

        // Load Global files (graphics factory)
        this.zone_model = await this.graphics_factory.LoadZone('erudsxing');

        this.CreateWorldSizing(this.zone_model);
        this.CreateWorldAxis(scene, 300);

        // console.log(engine);
        // console.log(scene);
        return scene;
    }

    private CreateAmbientLight(scene: BABYLON.Scene): BABYLON.HemisphericLight
    {
        const light       = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(0, 1, 0), scene);
        light.groundColor = new BABYLON.Color3(0, 0, 0);
        light.diffuse     = new BABYLON.Color3(1, 1, 1);
        light.specular    = new BABYLON.Color3(1, 1, 1);
        light.intensity   = 1;
        return light;
    }

    private CreateCamera(scene: BABYLON.Scene): BABYLON.FreeCamera
    {
        const camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, -100), scene);
        //@ts-ignore
        camera.inputs.attached.mouse.buttons = [2];
        camera.keysUp                        = [87];
        camera.keysLeft                      = [65];
        camera.keysDown                      = [83];
        camera.keysRight                     = [68];
        camera.inertia                       = 0;
        camera.speed                         = 100;
        camera.maxZ                          = 50000;
        camera.angularSensibility            = 300;

        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(this.canvas as HTMLCanvasElement, true);
        scene.activeCamera = camera;
        return camera;
    }

    private CreateControls(canvas: HTMLCanvasElement, engine: BABYLON.Engine, scene: BABYLON.Scene): void
    {
        // scene.onPointerObservable.add((pointerInfo) => {
        //     const button = pointerInfo.event.button;

        //     switch (pointerInfo.type) {
        //         case BABYLON.PointerEventTypes.POINTERTAP:
        //             // if (button === 0) { this.handleMouseClick(pointerInfo.pickInfo); }
        //             break;
        //         case BABYLON.PointerEventTypes.POINTERDOWN:
        //             if (button === 2) { canvas.requestPointerLock(); }
        //             break;
        //         case BABYLON.PointerEventTypes.POINTERUP:
        //             //if (button === 0) { this.handleMouseClick(pointerInfo.pickInfo); }
        //             if (button === 2) { document.exitPointerLock(); }
        //             break;
        //         default:
        //             break;
        //     }
        // });
    }

    private CreateLabels(scene: BABYLON.Scene): void
    {
        this.labels                 = GUI.AdvancedDynamicTexture.CreateFullscreenUI("Labels", true, scene);
        this.label_style            = this.labels.createStyle();
        this.label_style.fontFamily = "Arial";
        this.label_style.fontSize   = 12;
        this.label_style.fontStyle  = "italic"
    }

    private CreateGizmosAndHighlight(scene: BABYLON.Scene): void
    {
        this.position_gizmo = new BABYLON.PositionGizmo(BABYLON.UtilityLayerRenderer.DefaultUtilityLayer);
        this.position_gizmo.updateGizmoRotationToMatchAttachedMesh = false;
        // this.position_gizmo.onDragEndObservable.add(this.handleEntityDrag);

        this.rotation_gizmo = new BABYLON.PlaneRotationGizmo(
            BABYLON.Axis.Y, 
            BABYLON.Color3.Yellow(), 
            BABYLON.UtilityLayerRenderer.DefaultUtilityLayer
        );

        // this.rotation_gizmo.dragBehavior.onDragEndObservable.add(this.handleEntityDrag);

        this.highlight_layer = new BABYLON.HighlightLayer("HighlightLayer", scene);
    }

    private CreateRoamMaterials(scene: BABYLON.Scene): void
    {
        this.distance_material               = new BABYLON.StandardMaterial("DistanceMaterial", scene);
        this.distance_material.diffuseColor  = BABYLON.Color3.Teal();
        this.distance_material.specularColor = new BABYLON.Color3(0, 0, 0);
        this.distance_material.alpha         = 0.2;

        this.limits_material                 = new BABYLON.StandardMaterial("LimitsMaterial", scene);
        this.limits_material.diffuseColor    = BABYLON.Color3.Purple();
        this.limits_material.specularColor   = new BABYLON.Color3(0, 0, 0);
        this.limits_material.alpha           = 0.2;
    }

    private CreateWorldSizing(zone_model: BABYLON.Mesh): void
    {
        this.bounding_info       = zone_model.getBoundingInfo();
        this.center              = this.bounding_info.boundingBox.centerWorld;
        this.max                 = this.bounding_info.maximum;
        this.min                 = this.bounding_info.minimum;
        this.world_volume        = (this.max.x - this.min.x) * (this.max.y - this.min.y) * (this.max.z - this.min.z);
        this.default_mesh_length = Math.trunc(Math.sqrt(Math.log(this.world_volume)) * 1);
    }

    private CreateWorldAxis(scene: BABYLON.Scene, size: number): void
    {
        const makeTextPlane = (text: string, color: string, size: number) => {
            const dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);

            const plane = BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);

            const material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
            material.backFaceCulling = false;
            material.specularColor = new BABYLON.Color3(0, 0, 0);
            material.diffuseTexture = dynamicTexture;

            plane.material = material;

            return plane;
        };

        const axisX = BABYLON.Mesh.CreateLines("WorldAxisX", [ 
          BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0), 
          new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
          ], scene);
        axisX.color = new BABYLON.Color3(1, 0, 0);

        const xChar = makeTextPlane("X", "red", size / 10);
        xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);

        const axisY = BABYLON.Mesh.CreateLines("WorldAxisY", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( -0.05 * size, size * 0.95, 0), 
            new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( 0.05 * size, size * 0.95, 0)
            ], scene);
        axisY.color = new BABYLON.Color3(0, 1, 0);

        const yChar = makeTextPlane("Y", "green", size / 10);
        yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);

        const axisZ = BABYLON.Mesh.CreateLines("WorldAxisZ", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0 , -0.05 * size, size * 0.95),
            new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0, 0.05 * size, size * 0.95)
            ], scene);
        axisZ.color = new BABYLON.Color3(0, 0, 1);

        const zChar = makeTextPlane("Z", "blue", size / 10);
        zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
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

export default connect<IMapState, {}, {}, IZoneEditorState>(mapStateToProps)(Editor);
