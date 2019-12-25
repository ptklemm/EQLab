import React                   from 'react';
import { remote, ipcRenderer } from 'electron';
import * as BABYLON            from 'babylonjs';
import { connect }             from 'react-redux';
import SplitterLayout          from 'react-splitter-layout';
import {
    IZoneEditorReduxState,
    IOptionsState,
    IZoneDataState
}                              from '../../redux/reducer';
import * as ACTION             from '../../redux/actions';
import DatabaseConnection      from '../../database/Database';
import FileLoader              from './loaders/FileLoader';
import GraphicsFactory         from './factory/GraphicsFactory';
import EntityManager           from './entity/EntityManager';
import SelectZoneModal         from './SelectZoneModal';
import OptionsPane             from './OptionsPane';
import ExplorerPane            from './ExplorerPane';

// const IN_DEVELOPMENT: boolean = remote.getGlobal('IN_DEVELOPMENT');
// const APP_NAME:       string  = remote.getGlobal('APP_NAME');
// const APP_VERSION:    string  = remote.getGlobal('APP_VERSION');

interface IMapState
{
    options:   IOptionsState;
    zonelist:  any[];
    zone_name: string | null;
    zone:      IZoneDataState
}

const mapStateToProps = (state: IZoneEditorReduxState): IMapState => ({
    options:   state.options,
    zonelist:  state.zonelist,
    zone_name: state.zone_name,
    zone:      state.zone
});

interface IMapDispatch
{
    setOptions:         (options: IOptionsState)                => void;
    setCameraSpeed:     (camera_speed: number)                  => void;
    setClipPlanes:      (clip_bottom: number, clip_top: number) => void;
    setLightIntensity:  (light_intensity: number)               => void;
    setInvisibleWalls:  (show_invisible_walls: boolean)         => void;
    setSafePoint:       (show_safe_point: boolean)              => void;
    setUnderworldPlane: (show_underworld_plane: boolean)        => void;
    setWireframe:       (show_wireframe: boolean)               => void;
    setBoundingBoxes:   (show_bounding_boxes: boolean)          => void;
    setFacetNormals:    (show_facet_normals: boolean)           => void;
    setZonelist:        (zonelist: any[])                       => void;
    setZonename:        (zone_name: string)                     => void;
}

const mapDispatchToProps: IMapDispatch = {
    setOptions:         (options: IOptionsState)                => ({ type: ACTION.SET_OPTIONS, options }),
    setCameraSpeed:     (camera_speed: number)                  => ({ type: ACTION.SET_CAMERA_SPEED, camera_speed }),
    setClipPlanes:      (clip_bottom: number, clip_top: number) => ({ type: ACTION.SET_CLIP_PLANES, clip_bottom, clip_top }),
    setLightIntensity:  (light_intensity: number)               => ({ type: ACTION.SET_LIGHT_INTENSITY, light_intensity }),
    setInvisibleWalls:  (show_invisible_walls: boolean)         => ({ type: ACTION.SET_INVISIBLE_WALLS, show_invisible_walls }),
    setSafePoint:       (show_safe_point: boolean)              => ({ type: ACTION.SET_SAFE_POINT, show_safe_point }),
    setUnderworldPlane: (show_underworld_plane: boolean)        => ({ type: ACTION.SET_UNDERWORLD_PLANE, show_underworld_plane }),
    setWireframe:       (show_wireframe: boolean)               => ({ type: ACTION.SET_WIREFRAME, show_wireframe }),
    setBoundingBoxes:   (show_bounding_boxes: boolean)          => ({ type: ACTION.SET_BOUNDING_BOXES, show_bounding_boxes }),
    setFacetNormals:    (show_facet_normals: boolean)           => ({ type: ACTION.SET_FACET_NORMALS, show_facet_normals }),
    setZonelist:        (zonelist: any[])                       => ({ type: ACTION.SET_ZONELIST,  zonelist }),
    setZonename:        (zone_name: string)                     => ({ type: ACTION.SET_ZONE_NAME, zone_name })
}

type IZoneEditorProps = IMapState & IMapDispatch;

interface IState
{
    canvas_width:   number;
    canvas_height:  number;
    selecting_zone: boolean;
    scene_loaded:   boolean;
}

class ZoneEditor extends React.Component<IZoneEditorProps, IState>
{
    private _window:            Electron.BrowserWindow;
    private DB:                 DatabaseConnection;
    private file_loader:        FileLoader;

    private canvas:             HTMLCanvasElement | null;
    private engine:             BABYLON.Engine | null;
    private scene:              BABYLON.Scene | null;
    private octree:             BABYLON.Octree<BABYLON.AbstractMesh> | null;
    private light:              BABYLON.HemisphericLight | null;
    private camera:             BABYLON.FreeCamera | null;
    private highlight_layer:    BABYLON.HighlightLayer | null;
    private facet_normals:      BABYLON.LinesMesh | null;

    private graphics_factory:   GraphicsFactory | null;
    private entity_manager:     EntityManager | null;

    private zone_model:         BABYLON.Mesh | null;
    private zone_geometry: {
        bounding_info:          BABYLON.BoundingInfo | null;
        center:                 BABYLON.Vector3 | null;
        max:                    BABYLON.Vector3 | null;
        min:                    BABYLON.Vector3 | null;
        volume:                 number | null;
    }

    constructor(props: IZoneEditorProps)
    {
        super(props);
        this.state = {
            canvas_width: window.innerWidth * 0.8,
            canvas_height: window.innerHeight,
            selecting_zone: false,
            scene_loaded: false
        }

        this._window = remote.getCurrentWindow();

        this.DB = new DatabaseConnection({
            host:     '127.0.0.1',
            user:     'root',
            password: 'sanchez88',
            database: 'nostalgia_eq'
        });

        this.file_loader = new FileLoader('X:\\EQCLIENT');

        this.canvas             = null;
        this.engine             = null;
        this.scene              = null;
        this.octree             = null;
        this.light              = null;
        this.camera             = null;
        this.highlight_layer    = null;
        this.facet_normals      = null;
        
        this.graphics_factory   = null;
        this.entity_manager     = null;

        this.zone_model         = null;
        this.zone_geometry      = {
            bounding_info:        null,
            center:               null,
            max:                  null,
            min:                  null,
            volume:               null
        }
 
        this.OnSecondaryPaneSizeChange = this.OnSecondaryPaneSizeChange.bind(this);

        this.CloseSelectZoneModal = this.CloseSelectZoneModal.bind(this);
        this.SelectZone = this.SelectZone.bind(this);
        this.ChangeCameraSpeed = this.ChangeCameraSpeed.bind(this);
        this.ChangeClipPlanes= this.ChangeClipPlanes.bind(this);
        this.ChangeLightIntensity = this.ChangeLightIntensity.bind(this);
        this.ToggleInvisibleWalls = this.ToggleInvisibleWalls.bind(this);
        this.ToggleSafePoint = this.ToggleSafePoint.bind(this);
        this.ToggleUnderworldPlane = this.ToggleUnderworldPlane.bind(this);
        this.ToggleWireframe = this.ToggleWireframe.bind(this);
        this.ToggleBoundingBoxes = this.ToggleBoundingBoxes.bind(this);
        this.ToggleFacetNormals = this.ToggleFacetNormals.bind(this);
    }

    public async componentDidMount()
    {
        this.ListenForMenuEvents();

        this.engine = new BABYLON.Engine(this.canvas, true, { stencil: true });

        window.addEventListener('resize', this.HandleWindowResize.bind(this));

        try {
            await this.DB.Connect();
        } catch (error) {
            throw error;
        }

        const zonelist = await this.DB.Zone.List();
        this.props.setZonelist(zonelist);

        await this.CreateScene(this.engine);
    }

    public componentDidUpdate(prevProps: IZoneEditorProps)
    {
        if (this.entity_manager && (prevProps !== this.props))
            this.entity_manager.GetReduxState();
    }

    public async componentWillUnmount()
    {
        if (this.scene && this.engine)
        {
            this.scene.dispose();
            this.engine.dispose();
        }

        await this.DB.End();
    }

    private ListenForMenuEvents(): void
    {
        ipcRenderer.on('open-zone', () => {
            this.ShowSelectZoneModal();
        });
    }

    private async ShowSelectZoneModal(): Promise<void>
    {
        this.setState({ selecting_zone: true });
    }

    private CloseSelectZoneModal(): void
    {
       this.setState({ selecting_zone: false }); 
    }

    private SelectZone(zone_short_name: string): void
    {
        if (!zone_short_name)
            return;

        this.CloseSelectZoneModal();

        if (zone_short_name !== this.props.zone_name)
        {
            this.props.setZonename(zone_short_name);
        }
    }

    private Reset(): void
    {
        this.scene              = null;
        this.octree             = null;
        this.light              = null;
        this.camera             = null;
        this.highlight_layer    = null;
        this.facet_normals      = null;
        this.graphics_factory   = null;
        this.entity_manager     = null;
        this.zone_model         = null;
        this.zone_geometry      = {
            bounding_info:        null,
            center:               null,
            max:                  null,
            min:                  null,
            volume:               null
        }
    }

    private ClearScene(): void
    {
        this.engine?.stopRenderLoop();
        this.scene?.dispose();
        this.Reset();
    }

    private async CreateScene(engine: BABYLON.Engine): Promise<void>
    {
        if (this.scene)
            this.ClearScene();
            
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
        scene.forceWireframe                         = this.props.options.show_wireframe;
        scene.getBoundingBoxRenderer().showBackLines = false;
        scene.forceShowBoundingBoxes                 = this.props.options.show_bounding_boxes;

        this.light                                   = this.CreateAmbientLight(scene);
        this.camera                                  = this.CreateCamera(scene);
        this.highlight_layer                         = new BABYLON.HighlightLayer("HighlightLayer", scene);

        this.CreateControls(this.canvas as HTMLCanvasElement, scene);

        this.graphics_factory = new GraphicsFactory(this.file_loader, scene, this.highlight_layer);
        
        // Load Global files (graphics factory)
        this.zone_model = await this.graphics_factory.LoadZone(this.props.zone_name) as BABYLON.Mesh;

        this.zone_geometry.bounding_info = this.zone_model.getBoundingInfo();
        this.zone_geometry.center        = this.zone_geometry.bounding_info.boundingBox.centerWorld;
        this.zone_geometry.max           = this.zone_geometry.bounding_info.maximum;
        this.zone_geometry.min           = this.zone_geometry.bounding_info.minimum;
        this.zone_geometry.volume        = (this.zone_geometry.max.x - this.zone_geometry.min.x) *
                                           (this.zone_geometry.max.y - this.zone_geometry.min.y) *
                                           (this.zone_geometry.max.z - this.zone_geometry.min.z);

        this.graphics_factory.default_mesh_length = Math.trunc(Math.sqrt(Math.log(this.zone_geometry.volume)) * 1);

        this.CreateZoneAxes(scene, 300);
        this.CreateClipPlanes(scene, this.zone_geometry.min.y, this.zone_geometry.max.y)

        this.octree = scene.createOrUpdateSelectionOctree();
        this.graphics_factory.octree = this.octree;

        this.entity_manager = new EntityManager(this.DB, scene, this.graphics_factory, this.highlight_layer, this.zone_geometry, this.octree);
        await this.entity_manager.PopulateZoneFromDatabase(this.props.zone_name);

        // console.log(engine);
        // console.log(scene);
        this.scene = scene;

        this.setState({ scene_loaded: true }, () => {
            this.engine?.runRenderLoop(() => {
                if (this.scene) {
                    this.scene.render();
                }
            });
        });
    }

    private CreateAmbientLight(scene: BABYLON.Scene): BABYLON.HemisphericLight
    {
        const light       = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(0, 1, 0), scene);
        light.groundColor = new BABYLON.Color3(0, 0, 0);
        light.diffuse     = new BABYLON.Color3(1, 1, 1);
        light.specular    = new BABYLON.Color3(1, 1, 1);
        light.intensity   = this.props.options.light_intensity / 100;
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
        camera.speed                         = this.props.options.camera_speed;
        camera.maxZ                          = 50000;
        camera.angularSensibility            = 300;

        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(this.canvas as HTMLCanvasElement, true);
        scene.activeCamera = camera;
        return camera;
    }

    private CreateControls(canvas: HTMLCanvasElement, scene: BABYLON.Scene): void
    {
        scene.onPointerObservable.add((pointerInfo) => {
            const button = pointerInfo.event.button;

            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERTAP:
                    // if (button === 0) { this.handleMouseClick(pointerInfo.pickInfo); }
                    break;
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    // if (button === 2) { canvas.requestPointerLock(); }
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    if (button === 0) { this.HandleMouseClick(pointerInfo.pickInfo); }
                    // if (button === 2) { document.exitPointerLock(); }
                    break;
                default:
                    break;
            }
        });
    }

    private HandleMouseClick(pick_info: BABYLON.PickingInfo | null)
    {
        console.log(pick_info);

        if (!pick_info)
            return;
        
    
    }

    private CreateZoneAxes(scene: BABYLON.Scene, size: number): void
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

    private CreateClipPlanes(scene: BABYLON.Scene, min_y: number, max_y: number): void
    {
        const bScale = min_y <= 0 ? -1 : 1;
        const tScale = max_y >= 0 ? -1 : 1;

        scene.clipPlane         = new BABYLON.Plane(0, -1, 0, Math.abs(min_y) * bScale);
        scene.clipPlane2        = new BABYLON.Plane(0,  1, 0, Math.abs(max_y) * tScale);

        this.props.setClipPlanes(min_y, max_y);
    }

    private ChangeCameraSpeed(value: number): void
    {
        if (this.camera)
        {
            this.camera.speed = value;
            this.props.setCameraSpeed(value);
        }
    }

    private ChangeClipPlanes(values: number[]): void
    {
        if (this.scene)
        {
            const [bottom, top] = values;
            const bScale = bottom <= 0 ? -1 : 1;
            const tScale = top    >= 0 ? -1 : 1;

            this.scene.clipPlane  = new BABYLON.Plane(0, -1, 0, Math.abs(bottom) * bScale);
            this.scene.clipPlane2 = new BABYLON.Plane(0,  1, 0, Math.abs(top) * tScale);
        }
    }

    private ChangeLightIntensity(value: number): void
    {
        if (this.light)
        {
            this.light.intensity = value / 100;
            this.props.setLightIntensity(value);
        }
    }

    private ToggleInvisibleWalls(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.scene)
        {
            this.scene.getMaterialByTags("Invisible", (material) => {
                event.target.checked === true ? material.alpha = 0.1 : material.alpha = 0.0;
            });

            this.props.setInvisibleWalls(event.target.checked);
        }
    }

    private ToggleSafePoint(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.entity_manager && this.entity_manager.safe_point)
        {
            this.entity_manager.safe_point.isVisible = event.target.checked;
            console.log(event.target.checked)
            this.props.setSafePoint(event.target.checked);
        }
    }

    private ToggleUnderworldPlane(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.entity_manager && this.entity_manager.underworld_plane)
        {
            this.entity_manager.underworld_plane.isVisible = event.target.checked;
            this.props.setUnderworldPlane(event.target.checked);
        }          
    }

    private ToggleWireframe(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.scene)
        {
            this.scene.forceWireframe = event.target.checked;
            this.props.setWireframe(event.target.checked);
        }
            
    }

    private ToggleBoundingBoxes(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.scene)
        {
            this.scene.forceShowBoundingBoxes = event.target.checked;
            this.props.setBoundingBoxes(event.target.checked);
        }
    }

    private ToggleFacetNormals(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (!this.zone_model)
            return;

        if (event.target.checked === true)
        {
            const positions = this.zone_model.getFacetLocalPositions();
            const normals   = this.zone_model.getFacetLocalNormals();
        
            const lines: any[] = [];
            for (let i = 0; i < positions.length; i++)
            {
                const line = [positions[i], positions[i].subtract(normals[i])];
                lines.push(line);
            }
    
            this.facet_normals = BABYLON.MeshBuilder.CreateLineSystem("FacetNormals", {lines: lines}, this.scene);
            this.facet_normals.color = BABYLON.Color3.Green();
    
            this.octree?.dynamicContent.push(this.facet_normals);
            
        }
        else
        {
            this.facet_normals?.dispose();
            this.facet_normals = null;
        }

        this.props.setFacetNormals(event.target.checked);
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
            <div id="ZoneEditor">
                <SelectZoneModal
                    selectingZone={this.state.selecting_zone}
                    zonelist={this.props.zonelist} 
                    close={this.CloseSelectZoneModal}
                    selectZone={this.SelectZone}
                />
                <SplitterLayout
                    percentage={false}
                    secondaryMinSize={window.innerWidth * 0.5}
                    secondaryInitialSize={this.state.canvas_width}
                    onSecondaryPaneSizeChange={this.OnSecondaryPaneSizeChange}
                >
                    <div id="LeftPanel">
                        <SplitterLayout vertical percentage={true} secondaryInitialSize={80}>
                            <OptionsPane
                                options={this.props.options}
                                sceneLoaded={this.state.scene_loaded}
                                changeCameraSpeed={this.ChangeCameraSpeed}
                                changeClipPlanes={this.ChangeClipPlanes}
                                changeLightIntensity={this.ChangeLightIntensity}
                                toggleInvisibleWalls={this.ToggleInvisibleWalls}
                                toggleSafePoint={this.ToggleSafePoint}
                                toggleUnderworldPlane={this.ToggleUnderworldPlane}
                                toggleWireframe={this.ToggleWireframe}
                                toggleBoundingBoxes={this.ToggleBoundingBoxes}
                                toggleFacetNormals={this.ToggleFacetNormals}
                            />
                            <ExplorerPane
                                zone={this.props.zone}
                            />
                        </SplitterLayout>
                    </div>
                    <div id="CanvasPanel" style={{ width: this.state.canvas_width, height: this.state.canvas_height }}>
                        <canvas 
                            id="ZoneEditorCanvas"
                            style={{ width: this.state.canvas_width, height: this.state.canvas_height }}
                            ref={(canvas) => {if (canvas !== null) { this.canvas = canvas; }}}
                        />
                    </div>
                </SplitterLayout>
            </div>
        );
    }
}

export default connect<IMapState, IMapDispatch, {}, IZoneEditorReduxState>(mapStateToProps, mapDispatchToProps)(ZoneEditor);
