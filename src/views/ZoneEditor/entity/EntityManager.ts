import * as BABYLON       from 'babylonjs';
import * as GUI           from 'babylonjs-gui';
import { find }           from 'lodash';
import store              from '../../../redux/store';
import {
    reset,
    change
}                         from 'redux-form';
import {
    IZoneEditorReduxState,
    IZoneDataState
}                         from '../../../redux/reducer';
import * as ACTION        from '../../../redux/actions';
import DatabaseConnection from '../../../database/Database';
import GraphicsFactory    from '../factory/GraphicsFactory';
import {
    EQPosition,
    EQHeading,
    FormatRespawnTime
}                         from './Utility';
import {
    EQEntity,
    Door,
    Spawn, ISpawnData
}                         from './Entity';
import { IZoneGeometry }  from '../types/types';

export default class EntityManager
{
    public  labels:                     GUI.AdvancedDynamicTexture;
    public  safe_point:                 BABYLON.LinesMesh | null;
    public  underworld_plane:           BABYLON.Mesh | null;
    public  roam_distance_cylinder:     BABYLON.Mesh | null;
    public  roam_limits_box:            BABYLON.Mesh | null;
    
    private _DB:                        DatabaseConnection;
    private _scene:                     BABYLON.Scene;
    private _graphics_factory:          GraphicsFactory;
    private _octree:                    BABYLON.Octree<BABYLON.AbstractMesh>;
    private _zone_geometry:             IZoneGeometry;

    private _label_style:               GUI.Style;
    private _position_gizmo:            BABYLON.PositionGizmo;
    private _rotation_gizmo:            BABYLON.PlaneRotationGizmo;
    private _guidelines:                BABYLON.LinesMesh | null;
    
    private _roam_distance_material:    BABYLON.StandardMaterial;
    private _roam_limits_material:      BABYLON.StandardMaterial;
    private _underworld_plane_material: BABYLON.StandardMaterial;

    private _state:                     IZoneEditorReduxState;

    constructor(DB: DatabaseConnection, scene: BABYLON.Scene, graphics_factory: GraphicsFactory,
        zone_geometry: IZoneGeometry, octree: BABYLON.Octree<BABYLON.AbstractMesh>)
    {
        this.labels                  = GUI.AdvancedDynamicTexture.CreateFullscreenUI("Labels", true, scene);
        this.safe_point              = null;
        this.underworld_plane        = null;

        this._DB                     = DB;
        this._scene                  = scene;
        this._graphics_factory       = graphics_factory;
        this._octree                 = octree;
        this._zone_geometry          = zone_geometry;

        this._label_style            = this.labels.createStyle();
        this._label_style.fontFamily = "Arial";
        this._label_style.fontSize   = 12;
        this._label_style.fontStyle  = "italic"

        this._position_gizmo = new BABYLON.PositionGizmo(BABYLON.UtilityLayerRenderer.DefaultUtilityLayer);
        this._position_gizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this._position_gizmo.onDragEndObservable.add(this.HandleEntityPositionDrag, undefined, undefined, this);

        this._rotation_gizmo = new BABYLON.PlaneRotationGizmo(
            BABYLON.Axis.Y, 
            BABYLON.Color3.Yellow(), 
            BABYLON.UtilityLayerRenderer.DefaultUtilityLayer
        );
        this._rotation_gizmo.dragBehavior.onDragEndObservable.add(this.HandleEntityRotationDrag, undefined, undefined, this);
        
        this._guidelines                              = null;

        this.roam_distance_cylinder                   = null;
        this._roam_distance_material                  = new BABYLON.StandardMaterial("DistanceMaterial", scene);
        this._roam_distance_material.diffuseColor     = BABYLON.Color3.Teal();
        this._roam_distance_material.specularColor    = new BABYLON.Color3(0, 0, 0);
        this._roam_distance_material.alpha            = 0.2;

        this.roam_limits_box                          = null;
        this._roam_limits_material                    = new BABYLON.StandardMaterial("LimitsMaterial", scene);
        this._roam_limits_material.diffuseColor       = BABYLON.Color3.Purple();
        this._roam_limits_material.specularColor      = new BABYLON.Color3(0, 0, 0);
        this._roam_limits_material.alpha              = 0.2;

        this._underworld_plane_material               = new BABYLON.StandardMaterial("UnderworldPlaneMaterial", scene);
        this._underworld_plane_material.diffuseColor  = BABYLON.Color3.Black();
        this._underworld_plane_material.specularColor = new BABYLON.Color3(0, 0, 0);
        this._underworld_plane_material.alpha         = 0.5;

        this._state                                   = store.getState().zone_editor;
    }

    public async PopulateZoneFromDatabase(zone_short_name: string | null): Promise<void>
    {
        if (!zone_short_name)
            return;

        // zone_points:          await Zone.ZonePoints(zone_short_name),
        // incoming_zone_points: await Zone.IncomingZonePoints(zone_short_name),
        // start_zones:          await Zone.StartZones(zone_short_name),
        // blocked_spells:       await Zone.BlockedSpells(zone_short_name),
        // incoming_doors:       await Zone.IncomingDoors(zone_short_name),
        // grid:                 await Zone.Grid(zone_short_name),
        // ground_spawns:        await Zone.GroundSpawns(zone_short_name),
        // objects:              await Zone.Objects(zone_short_name),
        // traps:                await Zone.Traps(zone_short_name)

        const data = await this._DB.Zone.Full(zone_short_name);
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

        for (const door_data of data.doors)
        {
            const door = this.EntityFactory(EQEntity.TYPE_DOOR, door_data) as Door | null;
            if (door)
                zone_data.doors.push(door);
        }

        for (const spawn_data of data.spawns)
        {
            const spawn = this.EntityFactory(EQEntity.TYPE_SPAWN, spawn_data) as Spawn | null;
            if (spawn)
                zone_data.spawns.push(spawn);
        }

        store.dispatch({ type: ACTION.SET_ZONE, zone: zone_data });
    }

    public GetReduxState(): void
    {
        this._state = store.getState().zone_editor;
    }

    public SelectEntity(mesh: BABYLON.AbstractMesh): void
    {
        const entity = this.GetEntityByTypeAndID(mesh.metadata.EQType, mesh.metadata.EQID);

        if (!entity)
            return;
        
        if (this._state.selected_entity)
        {
            if (this._state.selected_entity === entity)
            {
                // Entity is already selected
                return;
            }
            else
            {
                // Deselect current entity
                this.DeselectEntity(entity);
            }   
        }

        store.dispatch({ type: ACTION.SELECT_ENTITY, selected_entity: entity });

        this.CreateGuideLines(mesh);
        this._position_gizmo.attachedMesh = mesh;
        this._rotation_gizmo.attachedMesh = mesh;

        // Side-effects
        switch (entity.type)
        {
            case EQEntity.TYPE_SPAWN: this.SelectSpawn(entity as Spawn, mesh);
            default: break;
        }
    }

    private SelectSpawn(spawn: Spawn, mesh: BABYLON.AbstractMesh): void
    {
        if (spawn.data.spawngroup)
        {
            const roam_distance = spawn.data.spawngroup.dist;
            const min_x = spawn.data.spawngroup.min_x;
            const max_x = spawn.data.spawngroup.max_x;
            const min_y = spawn.data.spawngroup.min_y;
            const max_y = spawn.data.spawngroup.max_y;

            this.CreateRoamDistanceCylinder(roam_distance, mesh);
            this.CreateRoamLimitsBox(min_x, min_y, max_x, max_y);
        }
    }

    public ResetEntity(entity: EQEntity): void
    {
        // Reset Entity Form
        store.dispatch(reset(entity.type));

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        if (!mesh)
            return;

        const position = EQPosition.ToVector3(entity.data.x, entity.data.y, entity.data.z);

        let rotation: BABYLON.Quaternion;
        switch (entity.type)
        {
            case EQEntity.TYPE_DOOR:
                rotation = EQHeading.HeadingAndInclineToQuaternion(entity.data.heading, entity.data.incline);
                break;
            case EQEntity.TYPE_SPAWN:
                const spawn = entity as Spawn;
                rotation = EQHeading.ToQuaternion(spawn.data.heading);
                if (spawn.data.spawngroup)
                {
                    const spawngroup = spawn.data.spawngroup;
                    this.CreateRoamDistanceCylinder(spawngroup.dist, mesh);
                    this.CreateRoamLimitsBox(spawngroup.min_x, spawngroup.min_y, spawngroup.max_x, spawngroup.max_y);
                }
                break;
            default:
                return;
        }

        mesh.position = position;
        mesh.rotationQuaternion = rotation;
    }

    public DeselectEntity(entity: EQEntity): void
    {
        this.ResetEntity(entity);
        store.dispatch({ type: ACTION.CLEAR_ENTITY });

        this.DestroyGuideLines();
        this.roam_distance_cylinder && this.roam_distance_cylinder.dispose();
        this.roam_distance_cylinder = null;
        this.roam_limits_box && this.roam_limits_box.dispose();
        this.roam_limits_box = null;
        this._position_gizmo.attachedMesh = null;
        this._rotation_gizmo.attachedMesh = null;
    }

    public ChangeEntityXPosition(entity: EQEntity, x: string): void
    {
        if (!x)
            x = '0';

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (!mesh)
            return;

        mesh.position.z  = Number(parseFloat(x).toFixed(6));
    }

    public ChangeEntityYPosition(entity: EQEntity, y: string): void
    {
        if (!y)
            y = '0';

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (!mesh)
            return;

        mesh.position.x  = Number(parseFloat(y).toFixed(6));
    }

    public ChangeEntityZPosition(entity: EQEntity, z: string): void
    {
        if (!z)
            z = '0';

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (!mesh)
            return;

        mesh.position.y = Number(parseFloat(z).toFixed(6));
    }

    public ChangeEntityHeading(entity: EQEntity, heading: string): void
    {
        if (!heading)
            heading = '0';

        let num_heading = Number(parseFloat(heading).toFixed(6));
        
        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (!mesh)
            return;

        mesh.rotationQuaternion = EQHeading.ToQuaternion(num_heading);
    }

    public CreateRoamDistanceCylinder(roam_distance: number, mesh: BABYLON.AbstractMesh): void
    {
        this.roam_distance_cylinder && this.roam_distance_cylinder.dispose();
        this.roam_distance_cylinder = null;

        if (roam_distance > 0) {
            this.roam_distance_cylinder = BABYLON.MeshBuilder.CreateCylinder("SpawngroupRoamDistance", {
                diameter: roam_distance * 2,
                height: (Math.abs(this._zone_geometry.min.y) + Math.abs(this._zone_geometry.max.y)) * 50,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE
            }, this._scene);
    
            this.roam_distance_cylinder.isPickable = false;
            this.roam_distance_cylinder.material = this._roam_distance_material;
            this.roam_distance_cylinder.position = mesh.position.clone();
            this.roam_distance_cylinder.isVisible = this._state.options.show_roam_distance_cylinder;
    
            this._octree.dynamicContent.push(this.roam_distance_cylinder);
            mesh.addChild(this.roam_distance_cylinder);
        }
    }

    public CreateRoamLimitsBox(min_x: number, min_y: number, max_x: number, max_y: number): void
    {
        this.roam_limits_box && this.roam_limits_box.dispose();
        this.roam_limits_box = null;

        if (Number.isNaN(min_x))
            min_x = 0;

        if (Number.isNaN(min_y))
            min_y = 0;

        if (Number.isNaN(max_x))
            max_x = 0;

        if (Number.isNaN(max_y))
            max_y = 0;

        const width = Math.abs(max_x - min_x);
        const depth = Math.abs(max_y - min_y);
        
        if (width > 0 && depth > 0) {

            const center_z = min_x + (width / 2);
            const center_x = min_y + (depth / 2);

            this.roam_limits_box = BABYLON.MeshBuilder.CreateBox("SpawngroupRoamLimits", {
                width: depth,
                depth: width,
                height: (Math.abs(this._zone_geometry.min.y) + Math.abs(this._zone_geometry.max.y)) * 50,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE
            }, this._scene);

            this.roam_limits_box.isPickable = false;
            this.roam_limits_box.material = this._roam_limits_material;
            this.roam_limits_box.position = new BABYLON.Vector3(center_x, 0, center_z);
            this.roam_limits_box.isVisible = this._state.options.show_roam_limits_box;

            this._octree.dynamicContent.push(this.roam_limits_box);
        }
    }

    private HandleEntityPositionDrag(): void
    {
        // Used to update Redux-Form with position from drag-end
        const entity = this._state.selected_entity;
        if (!entity)
            return;

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        if (!mesh)
            return;

        const position = EQPosition.FromVector3(mesh.position).format(entity.type);

        store.dispatch(change(entity.type, EQEntity.GetXField(entity.type), position.x));
        store.dispatch(change(entity.type, EQEntity.GetYField(entity.type), position.y));
        store.dispatch(change(entity.type, EQEntity.GetZField(entity.type), position.z));
    }

    private HandleEntityRotationDrag(): void
    {
        // Used to update Redux-Form with rotation from drag-end
        const entity = this._state.selected_entity;
        if (!entity)
            return;

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        if (!mesh)
            return;

        const rotation = EQHeading.FromQuaternion(mesh.rotationQuaternion).format(entity.type);

        store.dispatch(change(entity.type, 'heading', rotation.heading));
    }
    
    private CreateGuideLines(mesh: BABYLON.AbstractMesh): void
    {
        const lines = [[
            new BABYLON.Vector3(-10000, mesh.position.y, mesh.position.z),
            new BABYLON.Vector3( 10000, mesh.position.y, mesh.position.z)
        ], [
            new BABYLON.Vector3(mesh.position.x, -10000, mesh.position.z),
            new BABYLON.Vector3(mesh.position.x,  10000, mesh.position.z)
        ], [
            new BABYLON.Vector3(mesh.position.x, mesh.position.y, -10000),
            new BABYLON.Vector3(mesh.position.x, mesh.position.y,  10000)
        ]];

        const colors = [[
            new BABYLON.Color4(1, 0, 0, 1),
            new BABYLON.Color4(1, 0, 0, 1)
        ], [
            new BABYLON.Color4(0, 1, 0, 1),
            new BABYLON.Color4(0, 1, 0, 1)
        ], [
            new BABYLON.Color4(0, 0, 1, 1),
            new BABYLON.Color4(0, 0, 1, 1)
        ]];

        this._guidelines = BABYLON.MeshBuilder.CreateLineSystem("EntityGuidelines", { lines, colors, updatable: true }, this._scene);
        this._guidelines.isPickable = false;
        BABYLON.Tags.EnableFor(this._guidelines);
        this._octree.dynamicContent.push(this._guidelines);
        mesh.addChild(this._guidelines);
    }

    private DestroyGuideLines(): void
    {
        this._guidelines && this._guidelines.dispose();
        this._guidelines = null;
    }

    private EntityFactory(type: string, data: any): EQEntity | null
    {
        let entity: EQEntity | null = null;
        let mesh: BABYLON.InstancedMesh | null = null;

        switch (type)
        {
            case EQEntity.TYPE_DOOR:
                [entity, mesh] = this.CreateDoor(data);
                break;
            case EQEntity.TYPE_SPAWN:
                [entity, mesh] = this.CreateSpawn(data);
                break;
            default:
                break;
        }

        if (mesh)
            BABYLON.Tags.AddTagsTo(mesh, "Entity");

        return entity;
    }

    private CreateDoor(door: any): [Door, BABYLON.InstancedMesh]
    {
        const existing_model = this._scene.getMeshByID(`${door.name}_ACTORDEF`) as BABYLON.Mesh | null;
    
        let model: BABYLON.InstancedMesh;

        if (existing_model)
        {
            model = existing_model.createInstance(`door_${door.id}`);
        }
        else
        {
            model = this._graphics_factory.default_door_mesh.createInstance(`door_${door.id}`);
        }

        model.position           = EQPosition.ToVector3(door.pos_x, door.pos_y, door.pos_z);
        model.rotationQuaternion = EQHeading.HeadingAndInclineToQuaternion(door.heading, door.incline);
        model.scaling            = new BABYLON.Vector3(door.size / 100, door.size / 100, door.size / 100);
        model.isVisible          = this._state.options.show_doors;

        const label = new GUI.TextBlock();

        label.text             = `${door.name}_${door.id}`;
        label.color            = "#ffffff";
        label.style            = this._label_style;
        label.outlineWidth     = 2;
        label.outlineColor     = "#000000";
        label.isVisible        = this._state.options.show_door_labels;
        label.isPointerBlocker = false;
        label.metadata = { EQType: EQEntity.TYPE_DOOR, EQID: door.id, show: this._state.options.show_door_labels }

        this.labels.addControl(label);

        label.linkWithMesh(model);   
        label.linkOffsetY = -35;

        BABYLON.Tags.EnableFor(model);
        BABYLON.Tags.AddTagsTo(model, EQEntity.TYPE_DOOR);

        this._octree.dynamicContent.push(model);

        model.metadata = { EQType: EQEntity.TYPE_DOOR, EQID: door.id }

        return [new Door(door.id, label.uniqueId, model.uniqueId, door), model];
    }

    private CreateSpawn(spawn: ISpawnData): [Spawn, BABYLON.InstancedMesh]
    {
        const model = this._graphics_factory.default_spawn_mesh.createInstance(`spawn_${spawn.id}`);
        
        model.position = EQPosition.ToVector3(spawn.x, spawn.y, spawn.z);
        model.rotationQuaternion = EQHeading.ToQuaternion(spawn.heading);
        model.isVisible = this._state.options.show_spawns;

        const label = new GUI.TextBlock();

        if (spawn.spawngroup)
        {
            label.text = `${spawn.spawngroup.name} (${FormatRespawnTime(spawn.respawntime, spawn.variance)})`;
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
        label.isVisible        = this._state.options.show_spawn_labels;
        label.isPointerBlocker = false;
        label.metadata = { EQType: EQEntity.TYPE_SPAWN, EQID: spawn.id, show: this._state.options.show_spawn_labels }

        this.labels.addControl(label);

        label.linkWithMesh(model);   
        label.linkOffsetY = -35;

        BABYLON.Tags.EnableFor(model);
        BABYLON.Tags.AddTagsTo(model, EQEntity.TYPE_SPAWN);

        model.metadata = { EQType: EQEntity.TYPE_SPAWN, EQID: spawn.id }

        this._octree.dynamicContent.push(model);

        return [new Spawn(spawn.id, label.uniqueId, model.uniqueId, spawn), model];
    }

    private CreateSafePoint(position: EQPosition): void
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
        this.safe_point.isVisible = this._state.options.show_safe_point;

        this._octree.dynamicContent.push(this.safe_point);
    }

    private CreateUnderworldPlane(eq_z_coord: number): void
    {
        this.underworld_plane = BABYLON.MeshBuilder.CreateGround("UnderworldPlane", {
            width: (Math.abs(this._zone_geometry.max.x) + Math.abs(this._zone_geometry.min.x)) * 1.1,
            height: (Math.abs(this._zone_geometry.max.z) + Math.abs(this._zone_geometry.min.z)) * 1.1
        }, this._scene);

        this.underworld_plane.material = this._underworld_plane_material;
        this.underworld_plane.position = new BABYLON.Vector3(this._zone_geometry.center.x, eq_z_coord, this._zone_geometry.center.z);
        this.underworld_plane.isPickable = false;
        this.underworld_plane.isVisible = this._state.options.show_underworld_plane;

        this._octree.dynamicContent.push(this.underworld_plane);
    }

    private GetEntityByTypeAndID(type: string, id: number): EQEntity | undefined
    {
        switch (type)
        {
            case EQEntity.TYPE_DOOR:  return find(this._state.zone.doors,  { id });
            case EQEntity.TYPE_SPAWN: return find(this._state.zone.spawns, { id });
            default:                  return;
        }
    }
}
