import * as BABYLON    from 'babylonjs';
import * as GUI        from 'babylonjs-gui';
import store           from '../../../redux/store';
import {
    IZoneEditorReduxState,
    IZoneDataState
}                      from '../../../redux/reducer';
import * as ACTION     from '../../../redux/actions';
import DatabaseConnection from '../../../database/Database';
import GraphicsFactory from '../factory/GraphicsFactory';
import { Entity, Spawn} from './Entity';
import { EQPosition, EQHeading }    from './Utility';

export default class EntityManager
{
    public  safe_point:                 BABYLON.LinesMesh | null;
    public  underworld_plane:           BABYLON.Mesh | null;
    
    private DB:                         DatabaseConnection;
    private _scene:                     BABYLON.Scene;
    private _graphics_factory:          GraphicsFactory;
    private _highlight_layer:           BABYLON.HighlightLayer;
    private _octree:                    BABYLON.Octree<BABYLON.AbstractMesh>;
    private _zone_geometry:             any;

    private _labels:                    GUI.AdvancedDynamicTexture;
    private _label_style:               GUI.Style;
    private _position_gizmo:            BABYLON.PositionGizmo;
    private _rotation_gizmo:            BABYLON.PlaneRotationGizmo;
    private _x_guideline:               BABYLON.LinesMesh | null;
    private _y_guideline:               BABYLON.LinesMesh | null;
    private _z_guideline:               BABYLON.LinesMesh | null;

    private _distance_material:         BABYLON.StandardMaterial | null;
    private _limits_material:           BABYLON.StandardMaterial | null;

    private _underworld_plane_material: BABYLON.StandardMaterial;

    private _state:                     IZoneEditorReduxState;

    constructor(DB: DatabaseConnection, scene: BABYLON.Scene, graphics_factory: GraphicsFactory,
        highlight_layer: BABYLON.HighlightLayer, zone_geometry: any, octree: BABYLON.Octree<BABYLON.AbstractMesh>)
    {
        this.DB                      = DB;
        this._scene                  = scene;
        this._graphics_factory       = graphics_factory;
        this._highlight_layer        = highlight_layer;
        this._octree                 = octree;
        this._zone_geometry          = zone_geometry;

        this._labels                 = GUI.AdvancedDynamicTexture.CreateFullscreenUI("Labels", true, scene);
        this._label_style            = this._labels.createStyle();
        this._label_style.fontFamily = "Arial";
        this._label_style.fontSize   = 12;
        this._label_style.fontStyle  = "italic"

        this._position_gizmo = new BABYLON.PositionGizmo(BABYLON.UtilityLayerRenderer.DefaultUtilityLayer);
        this._position_gizmo.updateGizmoRotationToMatchAttachedMesh = false;
        // this.position_gizmo.onDragEndObservable.add(this.handleEntityDrag);

        this._rotation_gizmo = new BABYLON.PlaneRotationGizmo(
            BABYLON.Axis.Y, 
            BABYLON.Color3.Yellow(), 
            BABYLON.UtilityLayerRenderer.DefaultUtilityLayer
        );

        // this.rotation_gizmo.dragBehavior.onDragEndObservable.add(this.handleEntityDrag);

        this._x_guideline = null;
        this._y_guideline = null;
        this._z_guideline = null;

        this._distance_material               = new BABYLON.StandardMaterial("DistanceMaterial", scene);
        this._distance_material.diffuseColor  = BABYLON.Color3.Teal();
        this._distance_material.specularColor = new BABYLON.Color3(0, 0, 0);
        this._distance_material.alpha         = 0.2;

        this._limits_material                 = new BABYLON.StandardMaterial("LimitsMaterial", scene);
        this._limits_material.diffuseColor    = BABYLON.Color3.Purple();
        this._limits_material.specularColor   = new BABYLON.Color3(0, 0, 0);
        this._limits_material.alpha           = 0.2;

        this.safe_point                       = null;

        this.underworld_plane                 = null;
        this._underworld_plane_material       = new BABYLON.StandardMaterial("UnderworldPlaneMaterial", scene);

        this._underworld_plane_material.diffuseColor  = BABYLON.Color3.Black();
        this._underworld_plane_material.specularColor = new BABYLON.Color3(0, 0, 0);
        this._underworld_plane_material.alpha         = 0.5;

        this._state = store.getState();
    }

    public GetReduxState(): void
    {
        this._state = store.getState();
    }

    public async PopulateZoneFromDatabase(zone_short_name: string | null): Promise<void>
    {
        if (!zone_short_name)
            return;

        // info:                 await Zone.Info(zone_short_name),
        // zone_points:          await Zone.ZonePoints(zone_short_name),
        // incoming_zone_points: await Zone.IncomingZonePoints(zone_short_name),
        // start_zones:          await Zone.StartZones(zone_short_name),
        // blocked_spells:       await Zone.BlockedSpells(zone_short_name),
        // doors:                await Zone.Doors(zone_short_name),
        // incoming_doors:       await Zone.IncomingDoors(zone_short_name),
        // fishing:              await Zone.Fishing(zone_short_name),
        // forage:               await Zone.Forage(zone_short_name),
        // grid:                 await Zone.Grid(zone_short_name),
        // ground_spawns:        await Zone.GroundSpawns(zone_short_name),
        // objects:              await Zone.Objects(zone_short_name),
        // spawns:               await Zone.Spawns(zone_short_name),
        // traps:                await Zone.Traps(zone_short_name)

        const data = await this.DB.Zone.Full(zone_short_name);
        console.log(data);

        this.CreateSafePoint(new EQPosition(data.info.safe_x, data.info.safe_y, data.info.safe_z));
        this.CreateUnderworldPlane(data.info.underworld);

        const zone_data: IZoneDataState = {
            info:                 data.info,
            zone_points:          [],
            incoming_zone_points: [],
            start_zones:          [],
            blocked_spells:       [],
            doors:                [],
            incoming_doors:       [],
            fishing:              [],
            forage:               [],
            grid:                 [],
            ground_spawns:        [],
            objects:              [],
            spawns:               [],
            traps:                []
        }

        for (const spawn_data of data.spawns)
        {
            const spawn = this.EntityFactory('SPAWN', spawn_data) as Spawn;
            zone_data.spawns.push(spawn);
        }

        store.dispatch({ type: ACTION.SET_ZONE, zone: zone_data });
    }

    private EntityFactory(type: string, data: any): Entity | null
    {
        let entity: Entity | null = null;

        switch (type)
        {
            case 'SPAWN':
                entity = this.CreateSpawn(data);
                break;
            default:
                break;
        }

        return entity;
    }

    private CreateSpawn(spawn: any): Spawn
    {
        const model = this._graphics_factory.InstanceSpawn(spawn.id);
        
        model.position = EQPosition.ToVector3(spawn.x, spawn.y, spawn.z);
        model.rotationQuaternion = EQHeading.ToQuaternion(spawn.heading);
        // model.setEnabled(this.state.showSpawns);

        const label = new GUI.TextBlock();

        if (spawn.spawngroup)
        {
            label.text = spawn.spawngroup.name;
            label.color = "#ffffff";
        }
        else
        {
            label.text = "NO SPAWNGROUP";
            label.color = "#ff0000";
        }
        
        label.style            = this._label_style;
        label.outlineWidth     = 2;
        label.outlineColor     = "#000000";
        // label.isVisible    = this.state.showSpawnLabels;
        label.isPointerBlocker = false;
        // label.metadata = { EQType: "Spawn2", EQID: spawn2.id }

        this._labels.addControl(label);

        label.linkWithMesh(model);   
        label.linkOffsetY = -35;

        // BABYLON.Tags.EnableFor(model);
        // model.addTags("Entity Spawn2");

        // model.metadata = { EQType: "Spawn2", EQID: spawn2.id }

        this._octree.dynamicContent.push(model);

        return new Spawn(spawn.id, label.uniqueId, model.uniqueId, spawn);
    }

    private CreateSafePoint(position: EQPosition)
    {
        const pos = position.toVector3();

        const lines = [[
            new BABYLON.Vector3(-10000, pos.y, pos.z),
            new BABYLON.Vector3( 10000, pos.y, pos.z)
        ], [
            new BABYLON.Vector3(pos.x, -10000, pos.z),
            new BABYLON.Vector3(pos.x,  10000, pos.z)
        ], [
            new BABYLON.Vector3(pos.x, pos.y, -10000),
            new BABYLON.Vector3(pos.x, pos.y,  10000)
        ]];

        this.safe_point = BABYLON.MeshBuilder.CreateLineSystem("SafePoint", { lines, updatable: true}, this._scene);
        this.safe_point.isPickable = false;
        this.safe_point.color = BABYLON.Color3.FromHexString('#87CEEB');

        this._octree.dynamicContent.push(this.safe_point);
    }

    private CreateUnderworldPlane(eq_z_coord: number)
    {
        this.underworld_plane = BABYLON.MeshBuilder.CreateGround("UnderworldPlane", {
            width: (Math.abs(this._zone_geometry.max.x) + Math.abs(this._zone_geometry.min.x)) * 1.1,
            height: (Math.abs(this._zone_geometry.max.z) + Math.abs(this._zone_geometry.min.z)) * 1.1
        }, this._scene);

        this.underworld_plane.material = this._underworld_plane_material;
        this.underworld_plane.position = new BABYLON.Vector3(this._zone_geometry.center.x, eq_z_coord, this._zone_geometry.center.z);
        this.underworld_plane.isPickable = false;
        this.underworld_plane.isVisible = this._state.options.show_underworld_plane;

        this._highlight_layer.addExcludedMesh(this.underworld_plane);
        this._octree.dynamicContent.push(this.underworld_plane);
    }
}
