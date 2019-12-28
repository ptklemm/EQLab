import React                   from 'react';
import { remote, ipcRenderer } from 'electron';
import * as BABYLON            from 'babylonjs';
import { connect }             from 'react-redux';
import { debounce }            from 'lodash';
import SplitterLayout          from 'react-splitter-layout';
import {
    IOptionsState,
    IZoneDataState
}                              from '../../redux/reducer';
import { IReduxState }         from '../../redux/store';
import * as ACTION             from '../../redux/actions';
import DatabaseConnection      from '../../database/Database';
import FileLoader              from './loaders/FileLoader';
import GraphicsFactory         from './factory/GraphicsFactory';
import { EQEntity }            from './entity/Entity';
import EntityManager           from './entity/EntityManager';
import SelectZoneModal         from './SelectZoneModal';
import OptionsPane             from './OptionsPane';
import ExplorerPane            from './ExplorerPane';
import EntityPanel             from './EntityPanel/EntityPanel';
import {
    IZoneListEntry,
    IZoneGeometry
}                              from './types/types';

// const IN_DEVELOPMENT: boolean = remote.getGlobal('IN_DEVELOPMENT');
// const APP_NAME:       string  = remote.getGlobal('APP_NAME');
// const APP_VERSION:    string  = remote.getGlobal('APP_VERSION');

interface IMapState
{
    options:         IOptionsState;
    zonelist:        IZoneListEntry[];
    zone_name:       string;
    zone:            IZoneDataState;
    selected_entity: EQEntity | null;
}

const mapStateToProps = (state: IReduxState): IMapState => ({
    options:         state.zone_editor.options,
    zonelist:        state.zone_editor.zonelist,
    zone_name:       state.zone_editor.zone_name,
    zone:            state.zone_editor.zone,
    selected_entity: state.zone_editor.selected_entity
});

interface IMapDispatch
{
    setOptions:      (options: IOptionsState) => void;
    setZonelist:     (zonelist: any[])        => void;
    setZonename:     (zone_name: string)      => void;
}

const mapDispatchToProps: IMapDispatch = {
    setOptions:      (options: IOptionsState) => ({ type: ACTION.SET_OPTIONS, options }),
    setZonelist:     (zonelist: any[])        => ({ type: ACTION.SET_ZONELIST,  zonelist }),
    setZonename:     (zone_name: string)      => ({ type: ACTION.SET_ZONE_NAME, zone_name })
}

type IZoneEditorProps = IMapState & IMapDispatch;

interface IState
{
    canvas_width:         number;
    canvas_height:        number;
    selecting_zone:       boolean;
    scene_loaded:         boolean;
    camera_speed:         number;
    light_intensity:      number;
    clip_top_init:        number;
    clip_bottom_init:     number;
    clip_top:             number;
    clip_bottom:          number;
    show_invisible_walls: boolean;
    show_wireframe:       boolean;
    show_bounding_boxes:  boolean;
    show_axis:            boolean;
    show_facet_normals:   boolean;
    objects:              string[];
    materials:            string[];
    spawngroup_expanded:  boolean;
}

class ZoneEditor extends React.Component<IZoneEditorProps, IState>
{
    private _window:          Electron.BrowserWindow;
    private DB:               DatabaseConnection;
    private file_loader:      FileLoader;

    private canvas:           HTMLCanvasElement | null;
    private engine:           BABYLON.Engine | null;
    private scene:            BABYLON.Scene | null;
    private octree:           BABYLON.Octree<BABYLON.AbstractMesh> | null;
    private light:            BABYLON.HemisphericLight | null;
    private camera:           BABYLON.FreeCamera | null;
    private zone_axes:        BABYLON.TransformNode | null;
    private facet_normals:    BABYLON.LinesMesh | null;

    private graphics_factory: GraphicsFactory | null;
    private entity_manager:   EntityManager | null;

    private zone_model:       BABYLON.Mesh | null;
    private zone_geometry:    IZoneGeometry | null;

    constructor(props: IZoneEditorProps)
    {
        super(props);
        this.state = {
            canvas_width:          window.innerWidth * 0.75,
            canvas_height:         window.innerHeight,
            selecting_zone:        false,
            scene_loaded:          false,
            camera_speed:          100,
            light_intensity:       100,
            clip_top_init:         10000,
            clip_bottom_init:     -10000,
            clip_top:              10000,
            clip_bottom:          -10000,
            show_invisible_walls:  true,
            show_wireframe:        false,
            show_bounding_boxes:   false,
            show_axis:             false,
            show_facet_normals:    false,
            objects:               [],
            materials:             [],
            spawngroup_expanded:   false
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
        this.zone_axes          = null;
        this.facet_normals      = null;
        
        this.graphics_factory   = null;
        this.entity_manager     = null;

        this.zone_model         = null;
        this.zone_geometry      = null;
 
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
        this.ToggleZoneObject = this.ToggleZoneObject.bind(this);
        this.ToggleMaterial = this.ToggleMaterial.bind(this);
        this.HandleFormSave = this.HandleFormSave.bind(this);
        this.HandleFormReset = this.HandleFormReset.bind(this);
        this.HandleFormClose = this.HandleFormClose.bind(this);
        this.HandleFormXChange = this.HandleFormXChange.bind(this);
        this.HandleFormYChange = this.HandleFormYChange.bind(this);
        this.HandleFormZChange = this.HandleFormZChange.bind(this);
        this.HandleFormHeadingChange = this.HandleFormHeadingChange.bind(this);
        this.ToggleRoamCylinder = this.ToggleRoamCylinder.bind(this);
        this.ToggleRoamBox = this.ToggleRoamBox.bind(this);
        this.HandleFormRoamDistanceChange = this.HandleFormRoamDistanceChange.bind(this);
        this.HandleFormRoamLimitsChange = this.HandleFormRoamLimitsChange.bind(this);
        this.ToggleSpawngroupExpanded = this.ToggleSpawngroupExpanded.bind(this);
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

    // Window Menu
    ListenForMenuEvents(): void
    {
        ipcRenderer.on('open-zone', () => {this.ShowSelectZoneModal();});

        ipcRenderer.on('toggle-entity-visibility', (e, entity_type, value) => {
            this.ToggleEntityVisibility(entity_type, value);
        });
    }

    async ShowSelectZoneModal(): Promise<void>
    {
        this.setState({ selecting_zone: true });
    }

    CloseSelectZoneModal(): void
    {
       this.setState({ selecting_zone: false }); 
    }

    ToggleEntityVisibility(entity_type: string, value: boolean): void
    {
        switch (entity_type)
        {
            case 'Doors':
                this.props.setOptions({ ...this.props.options, show_doors: value });
                this.ToggleMeshesByTags(EQEntity.TYPE_DOOR, value);
                break;
            case 'Door Labels':
                this.props.setOptions({ ...this.props.options, show_door_labels: value });
                this.ToggleLabelsByType(EQEntity.TYPE_DOOR, value);
                break;
            case 'Spawns':
                this.props.setOptions({ ...this.props.options, show_spawns: value });
                this.ToggleMeshesByTags(EQEntity.TYPE_SPAWN, value);
                break;
            case 'Spawn Labels':
                this.props.setOptions({ ...this.props.options, show_spawn_labels: value });
                this.ToggleLabelsByType(EQEntity.TYPE_SPAWN, value);
                break;
            default:
                break;
        }
    }

    ToggleMeshesByTags(tags: string, value: boolean): void
    {
        if (!this.scene)
            return;

        this.scene.getMeshesByTags(tags, mesh => {
            mesh.isVisible = value;
        });
    }

    ToggleLabelsByType(entity_type: string, value: boolean): void
    {
        if (!this.entity_manager || !this.entity_manager.labels)
            return;
        
        this.entity_manager.labels.executeOnAllControls(label => {
            if (label.metadata && label.metadata.EQType === entity_type)
                label.metadata.show = value;
                // label.isVisible = value;
        });
    }

    SelectZone(zone_short_name: string): void
    {
        if (!zone_short_name)
            return;

        this.CloseSelectZoneModal();

        if (zone_short_name !== this.props.zone_name)
        {
            this.props.setZonename(zone_short_name);
        }
    }

    // Scene
    DestroyScene(): void
    {
        this.engine?.stopRenderLoop();
        this.scene?.dispose();

        this.scene            = null;
        this.octree           = null;
        this.light            = null;
        this.camera           = null;
        this.facet_normals    = null;
        this.graphics_factory = null;
        this.entity_manager   = null;
        this.zone_model       = null;
        this.zone_geometry    = null;
        this.zone_axes        = null;

        this.setState({ 
            clip_top_init:     10000,
            clip_bottom_init: -10000,
            clip_top:          10000,
            clip_bottom:      -10000,
            objects:           [],
            materials:         []
        });
    }

    async CreateScene(engine: BABYLON.Engine): Promise<void>
    {
        if (this.scene)
            this.DestroyScene();
            
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
        scene.forceWireframe                         = this.state.show_wireframe;
        scene.getBoundingBoxRenderer().showBackLines = false;
        scene.forceShowBoundingBoxes                 = this.state.show_bounding_boxes;

        this.light                                   = this.CreateAmbientLight(scene);
        this.camera                                  = this.CreateCamera(scene);
    
        this.CreateControls(this.canvas as HTMLCanvasElement, scene);

        this.graphics_factory = new GraphicsFactory(this.file_loader, scene);
        
        // Load Global files (graphics factory)
        this.zone_model = await this.graphics_factory.LoadZone(this.props.zone_name) as BABYLON.Mesh;

        this.setState({
            objects:   this.GetObjectMeshNames(scene),
            materials: this.GetMaterialNames(scene)
        });

        this.zone_geometry = this.CalculateZoneGeometry(this.zone_model);
        this.zone_axes = this.graphics_factory.CreateZoneAxes(scene, 300);

        this.graphics_factory.default_mesh_length = Math.trunc(Math.sqrt(Math.log(this.zone_geometry.volume)) * 1);

        this.CreateClipPlanes(scene, this.zone_geometry.min.y, this.zone_geometry.max.y)

        this.octree = scene.createOrUpdateSelectionOctree();

        this.entity_manager = new EntityManager(this.DB, scene, this.graphics_factory, this.zone_geometry, this.octree);
        await this.entity_manager.PopulateZoneFromDatabase(this.props.zone_name);

        scene.registerBeforeRender(() => {
            if (this.entity_manager)
            {
                for (const label of this.entity_manager.labels._rootContainer.children)
                {
                    if (label._linkedMesh)
                    {
                        if (label.metadata.show === true)
                        {
                            label.isVisible = 
                            label._linkedMesh.position.y > this.state.clip_bottom &&
                            label._linkedMesh.position.y < this.state.clip_top;
                            
                        }
                        else
                        {
                            label.isVisible = false;
                        }
                    }
                }
            }
        });

        // console.log(engine);
        console.log(scene);
        this.scene = scene;

        this.setState({ scene_loaded: true }, () => {
            this.engine?.runRenderLoop(() => {
                if (this.scene) {
                    this.scene.render();
                }
            });
        });
    }

    CreateAmbientLight(scene: BABYLON.Scene): BABYLON.HemisphericLight
    {
        const light       = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(0, 1, 0), scene);
        light.groundColor = new BABYLON.Color3(0, 0, 0);
        light.diffuse     = new BABYLON.Color3(1, 1, 1);
        light.specular    = new BABYLON.Color3(1, 1, 1);
        light.intensity   = this.state.light_intensity / 100;
        return light;
    }

    CreateCamera(scene: BABYLON.Scene): BABYLON.FreeCamera
    {
        const camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, -100), scene);
        //@ts-ignore
        camera.inputs.attached.mouse.buttons = [2];
        camera.keysUp                        = [87];
        camera.keysLeft                      = [65];
        camera.keysDown                      = [83];
        camera.keysRight                     = [68];
        camera.inertia                       = 0;
        camera.speed                         = this.state.camera_speed;
        camera.maxZ                          = 50000;
        camera.angularSensibility            = 300;

        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(this.canvas as HTMLCanvasElement, true);
        scene.activeCamera = camera;
        return camera;
    }

    CreateControls(canvas: HTMLCanvasElement, scene: BABYLON.Scene): void
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

    HandleMouseClick(pick_info: BABYLON.PickingInfo | null)
    {
        if (!pick_info)
            return;

        this.PickFirstVisibleEntity(pick_info);
    }

    PickFirstVisibleEntity(pick_info: BABYLON.PickingInfo)
    {
        if (!this.scene || !pick_info.ray)
            return;

        // Return all picked meshes
        let pick_infos = this.scene.multiPickWithRay(pick_info.ray, mesh => true);
        // No meshes were hit
        if (!pick_infos || !pick_infos.length)
            return;
        // Array starts from farthest away, sort by distance
        pick_infos = pick_infos.sort((a, b) => a.distance - b.distance);
        // Get first entity
        let entity_mesh: BABYLON.AbstractMesh | null = null;
        for (const info of pick_infos)
        {
            const mesh = info.pickedMesh;
            if (!mesh)
                break;
            
            if
            (
                BABYLON.Tags.MatchesQuery(info.pickedMesh, "Entity") &&
                mesh.position.y > this.state.clip_bottom &&
                mesh.position.y < this.state.clip_top
            )
            {
                // Entity found
                entity_mesh = info.pickedMesh;
                break;
            }

            // Not an entity
            // Check if mesh material is hidden, if so, ignore this mesh
            if (mesh.material && mesh.material.alpha === 0.0)
                break;

            // Check culling, if mesh is not culled
            // return empty so we don't click through a wall
            const normal = info.getNormal();
            if (!normal)
                return;
            // The new pickInfos don't have a ray attached so use the original
            const ray_direction = pick_info.ray.direction;
            const dot_product = BABYLON.Vector3.Dot(normal, ray_direction);
            if (dot_product > 0)
                return; // Non-culled mesh was hit
        }

        // Select the entity if one was picked
        if (entity_mesh && this.entity_manager)
            this.entity_manager.SelectEntity(entity_mesh);
    }

    CalculateZoneGeometry(zone_model: BABYLON.Mesh): IZoneGeometry
    {
        const bounding_info = zone_model.getBoundingInfo();
        const center        = bounding_info.boundingBox.centerWorld;
        const max           = bounding_info.maximum;
        const min           = bounding_info.minimum;
        const volume        = (max.x - min.x) * (max.y - min.y) * (max.z - min.z);

        return {
            bounding_info,
            center,
            max,
            min,
            volume
        }
    }

    CreateClipPlanes(scene: BABYLON.Scene, min_y: number, max_y: number): void
    {
        const bScale = min_y <= 0 ? -1 : 1;
        const tScale = max_y >= 0 ? -1 : 1;

        scene.clipPlane         = new BABYLON.Plane(0, -1, 0, Math.abs(min_y) * bScale);
        scene.clipPlane2        = new BABYLON.Plane(0,  1, 0, Math.abs(max_y) * tScale);

        this.setState({ clip_bottom_init: min_y, clip_top_init: max_y});
    }

    GetObjectMeshNames(scene: BABYLON.Scene): string[]
    {
        const array: string[] = [];

        for (const mesh of scene.meshes)
        {
            if (BABYLON.Tags.MatchesQuery(mesh, "ObjectPrototype"))
                array.push(mesh.name);
        }

        return array;
    }

    GetMaterialNames(scene: BABYLON.Scene): string[]
    {
        const array: string[] = [];

        for (const material of scene.materials)
        {
            array.push(material.name);
        }

        return array;
    }

    // Options Pane
    ChangeCameraSpeed(value: number): void
    {
        if (this.camera)
        {
            this.camera.speed = value;
            this.setState({ camera_speed: value });
        }
    }

    ChangeClipPlanes(values: number[]): void
    {
        if (this.scene)
        {
            const [bottom, top] = values;
            const bScale = bottom <= 0 ? -1 : 1;
            const tScale = top    >= 0 ? -1 : 1;

            this.scene.clipPlane  = new BABYLON.Plane(0, -1, 0, Math.abs(bottom) * bScale);
            this.scene.clipPlane2 = new BABYLON.Plane(0,  1, 0, Math.abs(top) * tScale);

            // this.props.setClipPlanes(bottom, top);
            this.setState({ clip_bottom: bottom, clip_top: top });
        }
    }

    ChangeLightIntensity(value: number): void
    {
        if (this.light)
        {
            this.light.intensity = value / 100;
            this.setState({ light_intensity: value });
        }
    }

    ToggleInvisibleWalls(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.scene)
        {
            this.scene.getMaterialByTags("Invisible", (material) => {
                event.target.checked === true ? material.alpha = 0.1 : material.alpha = 0.0;
            });

            this.setState({ show_invisible_walls: event.target.checked });
        }
    }

    ToggleSafePoint(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.entity_manager && this.entity_manager.safe_point)
        {
            this.entity_manager.safe_point.isVisible = event.target.checked;
            this.props.setOptions({ ...this.props.options, show_safe_point: event.target.checked });
        }
    }

    ToggleUnderworldPlane(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.entity_manager && this.entity_manager.underworld_plane)
        {
            this.entity_manager.underworld_plane.isVisible = event.target.checked;
            this.props.setOptions({ ...this.props.options, show_underworld_plane: event.target.checked });
        }          
    }

    ToggleWireframe(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.scene)
        {
            this.scene.forceWireframe = event.target.checked;
            this.setState({ show_wireframe: event.target.checked });
        }
            
    }

    ToggleBoundingBoxes(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.scene)
        {
            this.scene.forceShowBoundingBoxes = event.target.checked;
            this.setState({ show_bounding_boxes: event.target.checked });
        }
    }

    ToggleFacetNormals(event: React.ChangeEvent<HTMLInputElement>): void
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

        this.setState({ show_facet_normals: event.target.checked });
    }

    ToggleZoneObject(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (!this.scene)
            return;
        
        this.scene.getMeshesByID(`object_${event.target.id}`).forEach(mesh => {
            mesh.isVisible = event.target.checked;
        });
    }

    ToggleMaterial(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (!this.scene)
            return;

        const material = this.scene.getMaterialByName(event.target.id);

        if (!material)
            return;

        material.alpha = event.target.checked ? 1.0 : 0.0;
    }

    // Entity Form
    async HandleFormSave(entity_type: string, data: any): Promise<void>
    {
        let result: any = null;

        switch (entity_type)
        {
            case EQEntity.TYPE_SPAWN:
                result = await this.DB.Spawn2.ZoneEditorSave(data);
                break;
            default:
                return;
        }
    }

    HandleFormReset(): void
    {
        if (this.entity_manager && this.props.selected_entity)
        {
            this.entity_manager.ResetEntity(this.props.selected_entity);
        }
    }

    HandleFormClose(): void
    {
        if (this.entity_manager && this.props.selected_entity)
        {
            this.entity_manager.DeselectEntity(this.props.selected_entity);
        }
    }

    HandleFormXChange = debounce((event: React.ChangeEvent<HTMLInputElement>) => {
        if (this.entity_manager && this.props.selected_entity)
        {
            this.entity_manager.ChangeEntityXPosition(this.props.selected_entity, event.target.value);
        }
    }, 500);

    HandleFormYChange = debounce((event: React.ChangeEvent<HTMLInputElement>) => {
        if (this.entity_manager && this.props.selected_entity)
        {
            this.entity_manager.ChangeEntityYPosition(this.props.selected_entity, event.target.value);
        }
    }, 500);

    HandleFormZChange = debounce((event: React.ChangeEvent<HTMLInputElement>) => {
        if (this.entity_manager && this.props.selected_entity)
        {
            this.entity_manager.ChangeEntityZPosition(this.props.selected_entity, event.target.value);
        }
    }, 500);

    HandleFormHeadingChange = debounce((event: React.ChangeEvent<HTMLInputElement>) => {
        if (this.entity_manager && this.props.selected_entity)
        {
            this.entity_manager.ChangeEntityHeading(this.props.selected_entity, event.target.value);
        }
    }, 500);

    ToggleSpawngroupExpanded(): void
    {
        const current_state = this.state.spawngroup_expanded;
        this.setState({ spawngroup_expanded: !current_state });
    }

    ToggleRoamCylinder(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.entity_manager && this.entity_manager.roam_distance_cylinder)
        {
            this.props.setOptions({ ...this.props.options, show_roam_distance_cylinder: event.target.checked });
            this.entity_manager.roam_distance_cylinder.isVisible = event.target.checked;
        }
    }

    HandleFormRoamDistanceChange(event: React.ChangeEvent<HTMLInputElement>)
    {
        if (this.scene && this.entity_manager && this.props.selected_entity)
        {
            const mesh = this.scene.getMeshByUniqueID(this.props.selected_entity.mesh_id);
            if (!mesh)
                return;
            this.entity_manager.CreateRoamDistanceCylinder(Number(event.target.value), mesh)
        }
    }

    ToggleRoamBox(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (this.entity_manager && this.entity_manager.roam_limits_box)
        {
            this.props.setOptions({ ...this.props.options, show_roam_limits_box: event.target.checked });
            this.entity_manager.roam_limits_box.isVisible = event.target.checked;
        }
    }

    HandleFormRoamLimitsChange = (min_x: number, max_x: number, min_y: number, max_y: number) =>
    {
        if (this.entity_manager)
        {
            this.entity_manager.CreateRoamLimitsBox(min_x, min_y, max_x, max_y);
        }
    }

    // Window
    HandleWindowResize(event: UIEvent): void
    {
        this.setState({ canvas_width: window.innerWidth, canvas_height: window.innerHeight }, () => {
            this.engine?.resize();
        });
    }

    OnSecondaryPaneSizeChange(width: number): void
    {
        this.setState({ canvas_width: width }, () => {
            this.engine?.resize();
        });
    }
    
    // Render
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
                        <SplitterLayout vertical percentage={true} secondaryInitialSize={70}>
                            <OptionsPane
                                sceneLoaded={this.state.scene_loaded}
                                cameraSpeed={this.state.camera_speed}
                                changeCameraSpeed={this.ChangeCameraSpeed}
                                lightIntensity={this.state.light_intensity}
                                changeLightIntensity={this.ChangeLightIntensity}
                                clipTopInit={this.state.clip_top_init}
                                clipBottomInit={this.state.clip_bottom_init}
                                changeClipPlanes={this.ChangeClipPlanes}
                                showInvisibleWalls={this.state.show_invisible_walls}
                                toggleInvisibleWalls={this.ToggleInvisibleWalls}
                                options={this.props.options}
                                toggleSafePoint={this.ToggleSafePoint}
                                toggleUnderworldPlane={this.ToggleUnderworldPlane}
                                objects={this.state.objects}
                                toggleObject={this.ToggleZoneObject}
                                materials={this.state.materials}
                                toggleMaterial={this.ToggleMaterial}
                            />
                            <ExplorerPane
                                zone={this.props.zone}
                            />
                        </SplitterLayout>
                    </div>
                    <div id="CanvasPanel" style={{
                        background: "#1E488FFF",
                        width: this.state.canvas_width,
                        height: this.state.canvas_height,
                        overflow: 'hidden'
                    }}>
                    {
                        this.props.selected_entity &&
                        <EntityPanel
                            style={{ position: 'absolute', top: 5, left: 5, width: 800 }}
                            entity={this.props.selected_entity}
                            saveForm={this.HandleFormSave}
                            resetForm={this.HandleFormReset}
                            closeForm={this.HandleFormClose}
                            handleXChange={this.HandleFormXChange}
                            handleYChange={this.HandleFormYChange}
                            handleZChange={this.HandleFormZChange}
                            handleHeadingChange={this.HandleFormHeadingChange}
                            spawngroupExpanded={this.state.spawngroup_expanded}
                            toggleSpawngroupExpanded={this.ToggleSpawngroupExpanded}
                            showRoamCylinder={this.props.options.show_roam_distance_cylinder}
                            toggleRoamCylinder={this.ToggleRoamCylinder}
                            handleRoamDistanceChange={this.HandleFormRoamDistanceChange}
                            showRoamBox={this.props.options.show_roam_limits_box}
                            toggleRoamBox={this.ToggleRoamBox}
                            handleRoamLimitsChange={this.HandleFormRoamLimitsChange}
                        />
                    }  
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

export default connect<IMapState, IMapDispatch, {}, IReduxState>(mapStateToProps, mapDispatchToProps)(ZoneEditor);
