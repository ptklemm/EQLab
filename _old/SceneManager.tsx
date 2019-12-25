import React                from 'react';
import * as BABYLON         from 'babylonjs';
import { connect }          from 'react-redux';
import { IZoneEditorState } from '../../redux/reducer';
import * as ACTION          from '../../redux/actions';
import FileLoader           from './loaders/FileLoader';
import GraphicsFactory      from './factory/GraphicsFactory';
import EntityManager        from './entity/EntityManager';

interface IMapState
{
    zone: any;
    scene_loading: boolean;
    scene_loaded: boolean;
}

const mapStateToProps = (state: IZoneEditorState): IMapState => ({
    zone: state.zone,
    scene_loading: state.scene_loading,
    scene_loaded: state.scene_loaded
});

interface IMapDispatch
{
    loadingScene: () => void;
    sceneLoaded: () => void;
}

const mapDispatchToProps: IMapDispatch = {
    loadingScene: () => ({ type: ACTION.ZE_LOADING_SCENE }),
    sceneLoaded: () => ({ type: ACTION.ZE_SCENE_LOADED })
}

type ISceneManagerProps = IMapState & IMapDispatch;

interface IState
{
    canvas_width: number;
    canvas_height: number;
}

class SceneManager extends React.Component<ISceneManagerProps, IState>
{
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
    private zone_bounding_info: BABYLON.BoundingInfo | null;
    private zone_center:        BABYLON.Vector3 | null;
    private zone_max:           BABYLON.Vector3 | null;
    private zone_min:           BABYLON.Vector3 | null;
    private zone_volume:        number | null;
    
    constructor(props: ISceneManagerProps)
    {
        super(props);

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
        this.zone_bounding_info = null;
        this.zone_center        = null;
        this.zone_max           = null;
        this.zone_min           = null;
        this.zone_volume        = null;

        this.OnSecondaryPaneSizeChange = this.OnSecondaryPaneSizeChange.bind(this);
    }

    public async componentDidMount(): Promise<void>
    {
        this.props.loadingScene();

        this.engine = new BABYLON.Engine(this.canvas, true, { stencil: true });

        window.addEventListener('resize', this.HandleWindowResize.bind(this));

        this.scene = await this.CreateScene(this.engine);
    }

    public componentDidUpdate(prevProps: ISceneManagerProps): void
    {
        if (this.props.zone.id !== prevProps.zone.id)
        {

            
        }
    }

    public componentWillUnmount(): void
    {
        if (this.scene && this.engine)
        {
            this.scene.dispose();
            this.engine.dispose();
        }   
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

        this.light                                   = this.CreateAmbientLight(scene);
        this.camera                                  = this.CreateCamera(scene);
        this.highlight_layer                         = new BABYLON.HighlightLayer("HighlightLayer", scene);

        this.CreateControls(this.canvas as HTMLCanvasElement, engine, scene);

        this.graphics_factory = new GraphicsFactory(new FileLoader('X:\\EQCLIENT'), scene, this.highlight_layer);
        
        // Load Global files (graphics factory)
        this.zone_model = await this.graphics_factory.LoadZone('erudsxing');

        this.zone_bounding_info = this.zone_model.getBoundingInfo();
        this.zone_center        = this.zone_bounding_info.boundingBox.centerWorld;
        this.zone_max           = this.zone_bounding_info.maximum;
        this.zone_min           = this.zone_bounding_info.minimum;
        this.zone_volume        = (this.zone_max.x - this.zone_min.x) * (this.zone_max.y - this.zone_min.y) * (this.zone_max.z - this.zone_min.z);
        this.graphics_factory.default_mesh_length = Math.trunc(Math.sqrt(Math.log(this.zone_volume)) * 1);

        this.CreateZoneAxes(scene, 300);
        this.CreateClipPlanes(scene, this.zone_min.y, this.zone_max.y)

        this.octree = scene.createOrUpdateSelectionOctree();
        this.graphics_factory.octree = this.octree;

        this.entity_manager   = new EntityManager(scene, this.graphics_factory, this.highlight_layer, this.octree);
        // Populate zone (EntityManager)

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
        const bottom_plane_init = Math.round(min_y * 3);
        const top_plant_init    = Math.round(max_y * 3);
        scene.clipPlane         = new BABYLON.Plane(0, -1, 0, Math.abs(min_y) * -1);
        scene.clipPlane2        = new BABYLON.Plane(0,  1, 0, Math.abs(max_y) * -1);
    }

    private ShowFacetNormals(zone_model: BABYLON.Mesh): void
    {
        const positions = zone_model.getFacetLocalPositions();
        const normals   = zone_model.getFacetLocalNormals();
    
        const lines: any[] = [];
        for (let i = 0; i < positions.length; i++)
        {
            const line = [positions[i], positions[i].add(normals[i])];
            lines.push(line);
        }

        this.facet_normals = BABYLON.MeshBuilder.CreateLineSystem("FacetNormals", {lines: lines}, this.scene);
        this.facet_normals.color = BABYLON.Color3.Green();

        this.octree?.dynamicContent.push(this.facet_normals);
    }

    private HideFacetNormals()
    {
        this.facet_normals?.dispose();
        this.facet_normals = null;
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
            <canvas 
                id="ZoneEditorCanvas"
                style={{
                    width: this.state.canvas_width,
                    height: this.state.canvas_height
                }}
                ref={(canvas) => {
                    if (canvas !== null) { this.canvas = canvas; }
                }}
            />
        );
    }
}

export default connect<IMapState, IMapDispatch, {}, IZoneEditorState>(mapStateToProps, mapDispatchToProps)(SceneManager);
