import * as BABYLON       from 'babylonjs';
import * as GUI           from 'babylonjs-gui';
import { find }           from 'lodash';
import store              from '../../../redux/store';
import {
    reset as resetReduxForm,
    change as changeReduxForm
}                         from 'redux-form';
import {
    IZoneEditorReduxState,
    IZoneDataState
}                         from '../../../redux/reducer';
import * as ACTION        from '../../../redux/actions';
import DatabaseConnection from '../../../database/Database';
import GraphicsFactory    from '../graphics/GraphicsFactory';
import {
    EQPosition,
    EQHeading,
    FormatRespawnTime
}                         from './Utility';
import {
    EQEntity,
    Door,
    IDoorData,
    GroundSpawn,
    IGroundSpawnData,
    Spawn,
    ISpawnData, 
    Trap,
    ITrapData
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
        // this._label_style.fontStyle  = "italic"

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
        this._roam_distance_material                  = new BABYLON.StandardMaterial("RoamDistanceMaterial", scene);
        this._roam_distance_material.diffuseColor     = BABYLON.Color3.Teal();
        this._roam_distance_material.alpha            = 0.3;
        this._roam_distance_material.wireframe        = false;

        this.roam_limits_box                          = null;
        this._roam_limits_material                    = new BABYLON.StandardMaterial("RoamLimitsMaterial", scene);
        this._roam_limits_material.diffuseColor       = BABYLON.Color3.Purple();
        this._roam_limits_material.alpha              = 0.3;
        this._roam_limits_material.wireframe          = false;

        this._underworld_plane_material               = new BABYLON.StandardMaterial("UnderworldPlaneMaterial", scene);
        this._underworld_plane_material.diffuseColor  = BABYLON.Color3.Black();
        this._underworld_plane_material.specularColor = BABYLON.Color3.Black();
        this._underworld_plane_material.alpha         = 0.5;

        this._state                                   = store.getState().zone_editor;
    }

    public async PopulateSceneFromDatabase(zone_short_name: string | null): Promise<number>
    {
        if (!zone_short_name)
            return 0;

        // zone_points:          await Zone.ZonePoints(zone_short_name),
        // incoming_zone_points: await Zone.IncomingZonePoints(zone_short_name),
        // start_zones:          await Zone.StartZones(zone_short_name),
        // blocked_spells:       await Zone.BlockedSpells(zone_short_name),
        // incoming_doors:       await Zone.IncomingDoors(zone_short_name),
        // grid:                 await Zone.Grid(zone_short_name),
        // ground_spawns:        await Zone.GroundSpawns(zone_short_name),
        // objects:              await Zone.Objects(zone_short_name),

        const data = await this._DB.Zone.Full(zone_short_name);
        console.log(data);

        this.CreateSafePoint(new EQPosition(data.info.safe_x, data.info.safe_y, data.info.safe_z));
        this.CreateUnderworldPlane(data.info.underworld);

        const zone_data: IZoneDataState = {
            info:                 data.info,
            blocked_spells:       [],
            doors:                [],
            incoming_doors:       [],
            fishing:              [],
            forage:               [],
            grid:                 [],
            ground_spawns:        [],
            objects:              [],
            spawns:               [],
            start_zones:          [],
            traps:                [],
            zone_points:          [],
            incoming_zone_points: []
        }

        for (const door_data of data.doors)
        {
            const door = this.EntityFactory(EQEntity.TYPE_DOOR, door_data) as Door | null;
            if (door)
                zone_data.doors.push(door);
        }

        for (const ground_spawn_data of data.ground_spawns)
        {
            const ground_spawn = this.EntityFactory(EQEntity.TYPE_GROUNDSPAWN, ground_spawn_data) as GroundSpawn | null;
            if (ground_spawn)
                zone_data.ground_spawns.push(ground_spawn);
        }

        for (const spawn_data of data.spawns)
        {
            const spawn = this.EntityFactory(EQEntity.TYPE_SPAWN, spawn_data) as Spawn | null;
            if (spawn)
                zone_data.spawns.push(spawn);
        }

        for (const trap_data of data.traps)
        {
            const trap = this.EntityFactory(EQEntity.TYPE_TRAP, trap_data) as Trap | null;
            if (trap)
                zone_data.traps.push(trap);
        }

        store.dispatch({ type: ACTION.SET_ZONE, zone: zone_data });

        return data.info.underworld;
    }

    public DepopulateScene(): void
    {
        this.safe_point && this.safe_point.dispose();
        this.underworld_plane && this.underworld_plane.dispose();
        this._guidelines && this._guidelines.dispose();
        this.roam_distance_cylinder && this.roam_distance_cylinder.dispose();
        this.roam_limits_box && this.roam_limits_box.dispose();

        this.labels.executeOnAllControls(control => {
            control.dispose();
        });

        this.DisposeMeshes(this._state.zone.doors);
        this.DisposeMeshes(this._state.zone.ground_spawns);
        this.DisposeMeshes(this._state.zone.spawns);
        this.DisposeMeshes(this._state.zone.traps);

        store.dispatch({ type: ACTION.RESET_ZONE });
    }

    private DisposeMeshes(entities: EQEntity[]): void
    {
        for (const entity of entities)
        {
            const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
            mesh && mesh.dispose();
        }
    }

    public GetReduxState(): void
    {
        this._state = store.getState().zone_editor;
    }

    public async UpdateDoor(data: any): Promise<void>
    {
        await this._DB.Door.Update(data);
        const new_door = await this._DB.Door.Select(data.id);

        store.dispatch({ type: ACTION.UPDATE_DOOR, door: new_door });

        if (this._state.selected_entity)
        {
            store.dispatch({ type: ACTION.UPDATE_ENTITY, data: new_door });
            this.PerformSideEffects(this._state.selected_entity);
        }
    }

    public async UpdateGroundSpawn(data: any): Promise<void>
    {
        await this._DB.GroundSpawn.Update(data);
        const new_ground_spawn = await this._DB.GroundSpawn.Select(data.id);

        store.dispatch({ type: ACTION.UPDATE_GROUNDSPAWN, ground_spawn: new_ground_spawn });

        if (this._state.selected_entity)
        {
            store.dispatch({ type: ACTION.UPDATE_ENTITY, data: new_ground_spawn });
            this.PerformSideEffects(this._state.selected_entity);
        }
    }

    public async UpdateSpawn(data: any): Promise<void>
    {
        // Update spawnentries and spawngroups first
        if (data.spawngroup)
        {
            await this._DB.SpawnGroup.Update(data.spawngroup);
            // Need to map all spawngroups in redux state after update to keep other spawns in sync
        }

        await this._DB.Spawn2.Update(data.spawn);
        const new_spawn = await this._DB.Spawn2.Tree(data.spawn.id);
        
        store.dispatch({ type: ACTION.UPDATE_SPAWN, spawn: new_spawn });

        if (this._state.selected_entity)
        {
            store.dispatch({ type: ACTION.UPDATE_ENTITY, data: new_spawn });
            this.PerformSideEffects(this._state.selected_entity);
        }
    }

    public async UpdateTrap(data: any): Promise<void>
    {
        await this._DB.Trap.Update(data);
        const new_trap = await this._DB.Trap.Select(data.id);

        store.dispatch({ type: ACTION.UPDATE_TRAP, trap: new_trap });

        if (this._state.selected_entity)
        {
            store.dispatch({ type: ACTION.UPDATE_ENTITY, data: new_trap });
            this.PerformSideEffects(this._state.selected_entity);
        }
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
                this.DeselectEntity(this._state.selected_entity);
            }   
        }

        store.dispatch({ type: ACTION.SELECT_ENTITY, selected_entity: entity });

        // Side-effects
        this.PerformSideEffects(entity, mesh);
    }

    private PerformSideEffects(entity: EQEntity, mesh: BABYLON.AbstractMesh | null = null)
    {
        if (!mesh)
            mesh = this._scene.getMeshByUniqueID(entity.mesh_id);

        if (!mesh)
            return;

        switch (entity.type)
        {
            case EQEntity.TYPE_DOOR:
                this._position_gizmo.attachedMesh = mesh;
                this._rotation_gizmo.attachedMesh = mesh;
                break;
            case EQEntity.TYPE_GROUNDSPAWN:
                this._rotation_gizmo.attachedMesh = mesh;
                // this.SelectGroundspawn(entity as GroundSpawn, mesh);
                break;
            case EQEntity.TYPE_SPAWN:
                this._position_gizmo.attachedMesh = mesh;
                this._rotation_gizmo.attachedMesh = mesh;
                this.SelectSpawn(entity as Spawn, mesh);
                break;
            case EQEntity.TYPE_TRAP:
                const trap_mesh = mesh as BABYLON.Mesh;
                const scaling_matrix = BABYLON.Matrix.Scaling(trap_mesh.scaling.x, trap_mesh.scaling.y, trap_mesh.scaling.z);
                trap_mesh.bakeTransformIntoVertices(scaling_matrix);
                trap_mesh.scaling = BABYLON.Vector3.One();
                this._position_gizmo.attachedMesh = mesh;
                break;
            default:
                break;
        }

        this.CreateGuideLines(mesh);
    }

    private SelectGroundspawn(ground_spawn: GroundSpawn, mesh: BABYLON.AbstractMesh): void
    {
        const width = Math.abs(ground_spawn.data.max_x - ground_spawn.data.min_x);
        const depth = Math.abs(ground_spawn.data.max_y - ground_spawn.data.min_y);

        if (width > 0 && depth > 0)
        {
            console.log('Show Ground Spawn Box')
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

    public async DeleteEntity(entity: EQEntity): Promise<void>
    {
        switch (entity.type)
        {
            case EQEntity.TYPE_DOOR:
                await this._DB.Door.Delete(entity.id);
                store.dispatch({ type: ACTION.DELETE_DOOR, id: entity.id });
                this.DeselectEntity(entity);
                break;
            case EQEntity.TYPE_SPAWN:
                await this._DB.Spawn2.Delete(entity.id);
                store.dispatch({ type: ACTION.DELETE_SPAWN, id: entity.id });
                this.DeselectEntity(entity);
                break;
            case EQEntity.TYPE_TRAP:
                await this._DB.Trap.Delete(entity.id);
                store.dispatch({ type: ACTION.DELETE_TRAP, id: entity.id });
                this.DeselectEntity(entity);
                break;
            default:
                break;
        }

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (mesh)
            mesh.dispose();

        const label = this.GetLabelByID(entity.label_id);

        if (label)
            label.dispose();
    }

    public ResetEntity(entity: EQEntity): void
    {
        // Reset Entity Form
        store.dispatch(resetReduxForm(entity.type));

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);

        if (!mesh)
            return;

        let position: BABYLON.Vector3;
        let rotation: BABYLON.Quaternion;

        switch (entity.type)
        {
            case EQEntity.TYPE_DOOR:
                const door = entity as Door;
                position = EQPosition.ToVector3(door.data.pos_x, door.data.pos_y, door.data.pos_z);
                rotation = EQHeading.HeadingAndInclineToQuaternion(door.data.heading, door.data.incline || 0);
                break;
            case EQEntity.TYPE_SPAWN:
                const spawn = entity as Spawn;
                position = EQPosition.ToVector3(spawn.data.x, spawn.data.y, spawn.data.z);
                rotation = EQHeading.ToQuaternion(spawn.data.heading);
                if (spawn.data.spawngroup)
                {
                    const spawngroup = spawn.data.spawngroup;
                    this.CreateRoamDistanceCylinder(spawngroup.dist, mesh);
                    this.CreateRoamLimitsBox(spawngroup.min_x, spawngroup.min_y, spawngroup.max_x, spawngroup.max_y);
                }
                break;
            case EQEntity.TYPE_TRAP:
                const trap = entity as Trap;
                position = EQPosition.ToVector3(trap.data.x, trap.data.y, trap.data.z);
                rotation = BABYLON.Quaternion.Zero();
                break;
            default:
                return;
        }

        mesh.position = position;
        mesh.rotationQuaternion = rotation;
        mesh.scaling = BABYLON.Vector3.One();
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

    public ChangeEntityXPosition(entity: EQEntity, x: string | number): void
    {
        let num_x = Number(x);

        if (isNaN(num_x) || !num_x)
            num_x = 0;

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (!mesh)
            return;

        mesh.position.z = num_x;
    }

    public ChangeEntityYPosition(entity: EQEntity, y: string | number): void
    {
        let num_y = Number(y);

        if (isNaN(num_y) || !num_y)
            num_y = 0;

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (!mesh)
            return;

        mesh.position.x = num_y;
    }

    public ChangeEntityZPosition(entity: EQEntity, z: string | number): void
    {
        let num_z = Number(z);

        if (isNaN(num_z) || !num_z)
            num_z = 0;

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (!mesh)
            return;

        mesh.position.y = num_z;
    }

    public ChangeEntityHeading(entity: EQEntity, heading: string | number, incline?: string | number): void
    {
        if (!heading)
            heading = '0';

        let num_heading = Number(heading);

        if (isNaN(num_heading) || !num_heading)
            num_heading = 0;
        
        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (!mesh)
            return;

        if (entity.type === EQEntity.TYPE_DOOR)
        {
            mesh.rotationQuaternion = EQHeading.HeadingAndInclineToQuaternion(num_heading, Number(incline) || 0);
        }
        else
        {
            mesh.rotationQuaternion = EQHeading.ToQuaternion(num_heading);
        }
    }

    public ChangeEntityRadius(entity: EQEntity, radius: string | number): void
    {
        if (!radius)
            radius = '0';

        let num_radius = Number(radius);

        if (isNaN(num_radius) || !num_radius)
            num_radius = 0;

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (!mesh)
            return;

        if (entity.type === EQEntity.TYPE_TRAP)
        {
            const trap = entity as Trap;
            const radius = trap.data.radius || 1;
            mesh.scaling = new BABYLON.Vector3(num_radius / radius, 1.0, num_radius / radius);
        }
    }

    public ChangeEntityHeight(entity: EQEntity, height: string | number): void
    {
        if (!height)
            height = '0';

        let num_height = Number(height);

        if (isNaN(num_height) || !num_height)
            num_height = 0;

        const mesh = this._scene.getMeshByUniqueID(entity.mesh_id);
        
        if (!mesh)
            return;
        
        if (entity.type === EQEntity.TYPE_TRAP)
        {
            const trap = entity as Trap;
            const height = trap.data.maxzdiff || 1;
            mesh.scaling = new BABYLON.Vector3(1.0, num_height / height, 1.0);
        }
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

        store.dispatch(changeReduxForm(entity.type, EQEntity.GetXField(entity.type), position.x));
        store.dispatch(changeReduxForm(entity.type, EQEntity.GetYField(entity.type), position.y));
        store.dispatch(changeReduxForm(entity.type, EQEntity.GetZField(entity.type), position.z));
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

        let rotation;

        if (entity.type === EQEntity.TYPE_DOOR)
        {
            rotation = EQHeading.QuaternionToHeadingAndIncline(mesh.rotationQuaternion).format(entity.type);
        }
        else
        {
            rotation = EQHeading.FromQuaternion(mesh.rotationQuaternion).format(entity.type);
        }

        store.dispatch(changeReduxForm(entity.type, 'heading', rotation.heading));
    }
    
    private CreateGuideLines(mesh: BABYLON.AbstractMesh): void
    {
        this._guidelines && this._guidelines.dispose();
        this._guidelines = null;

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
        let mesh: BABYLON.AbstractMesh | null = null;

        switch (type)
        {
            case EQEntity.TYPE_DOOR:
                [entity, mesh] = this.CreateDoor(data);
                break;
            case EQEntity.TYPE_GROUNDSPAWN:
                [entity, mesh] = this.CreateGroundSpawn(data);
                break;
            case EQEntity.TYPE_SPAWN:
                [entity, mesh] = this.CreateSpawn(data);
                break;
            case EQEntity.TYPE_TRAP:
                [entity, mesh] = this.CreateTrap(data);
                break;
            default:
                break;
        }

        if (mesh)
            BABYLON.Tags.AddTagsTo(mesh, "Entity");

        return entity;
    }

    private CreateDoor(door: IDoorData): [Door, BABYLON.InstancedMesh]
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
        model.rotationQuaternion = EQHeading.HeadingAndInclineToQuaternion(door.heading, door.incline || 0);
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

    private CreateGroundSpawn(data: IGroundSpawnData): [GroundSpawn, BABYLON.InstancedMesh]
    {
        const width = Math.abs(data.max_x - data.min_x);
        const depth = Math.abs(data.max_y - data.min_y);
        const center_x = width === 0 ? data.max_x : data.min_x + (width / 2);
        const center_y = depth === 0 ? data.max_y : data.min_y + (depth / 2);

        const mesh = this._graphics_factory.default_ground_spawn_mesh.createInstance(`ground_spawn_${data.id}`);
        mesh.position = EQPosition.ToVector3(center_x, center_y, data.max_z);
        mesh.rotationQuaternion = EQHeading.ToQuaternion(data.heading);
        // mesh.isVisible = this._state.options.show_traps;

        const label = new GUI.TextBlock();
        label.text             = `Ground Spawn_${data.id}: ${data.item_name}`;
        label.color            = "#ffffff";
        label.style            = this._label_style;
        label.outlineWidth     = 2;
        label.outlineColor     = "#000000";
        // label.isVisible        = this._state.options.show_trap_labels;
        label.isPointerBlocker = false;
        label.metadata = { EQType: EQEntity.TYPE_GROUNDSPAWN, EQID: data.id, show: true }

        this.labels.addControl(label);

        label.linkWithMesh(mesh);   
        label.linkOffsetY = -35;

        BABYLON.Tags.EnableFor(mesh);
        BABYLON.Tags.AddTagsTo(mesh, EQEntity.TYPE_GROUNDSPAWN);

        mesh.metadata = { EQType: EQEntity.TYPE_GROUNDSPAWN, EQID: data.id }

        this._octree.dynamicContent.push(mesh);

        return [new GroundSpawn(data.id, label.uniqueId, mesh.uniqueId, data), mesh];
    }

    private CreateSpawn(spawn: ISpawnData): [Spawn, BABYLON.InstancedMesh]
    {
        const model = this._graphics_factory.default_spawn_mesh.createInstance(`spawn_${spawn.id}`);
        
        model.position = EQPosition.ToVector3(spawn.x, spawn.y, spawn.z);
        model.rotationQuaternion = EQHeading.ToQuaternion(spawn.heading);
        model.isVisible = this._state.options.show_spawns;

        const label = new GUI.TextBlock();
        const [label_text, label_color] = this.CreateSpawnLabelText(spawn, false);

        label.text             = label_text;
        label.color            = label_color;
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

    private CreateTrap(trap: ITrapData): [Trap, BABYLON.Mesh]
    {
        const mesh = BABYLON.MeshBuilder.CreateCylinder(`trap_${trap.id}`, {
            height: trap.maxzdiff,
            diameter: trap.radius * 2,
            enclose: true,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
            updatable: true
        }, this._scene);

        mesh.material = this._graphics_factory.default_trap_material;
        mesh.position = EQPosition.ToVector3(trap.x, trap.y, trap.z);
        mesh.isVisible = this._state.options.show_traps;

        const label = new GUI.TextBlock();
        label.text             = this.CreateTrapLabelText(trap);
        label.color            = "#ffffff";
        label.style            = this._label_style;
        label.outlineWidth     = 2;
        label.outlineColor     = "#000000";
        label.isVisible        = this._state.options.show_trap_labels;
        label.isPointerBlocker = false;
        label.metadata = { EQType: EQEntity.TYPE_TRAP, EQID: trap.id, show: this._state.options.show_trap_labels }

        this.labels.addControl(label);

        label.linkWithMesh(mesh);   
        label.linkOffsetY = -35;

        BABYLON.Tags.EnableFor(mesh);
        BABYLON.Tags.AddTagsTo(mesh, EQEntity.TYPE_TRAP);

        mesh.metadata = { EQType: EQEntity.TYPE_TRAP, EQID: trap.id }

        this._octree.dynamicContent.push(mesh);

        return [new Trap(trap.id, label.uniqueId, mesh.uniqueId, trap), mesh];
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

    public CreateSpawnLabelText(spawn: ISpawnData, show_respawn_time: boolean = false): [string, string]
    {
        let text = '';
        let color = '';
        if (spawn.spawngroup)
        {
            if (show_respawn_time)
            {
                text = `${spawn.spawngroup.name} (${FormatRespawnTime(spawn.respawntime, spawn.variance)})`;
            }
            else
            {
                text = `${spawn.spawngroup.name}`;
            }
            color = "#ffffff";
        }
        else
        {
            text = "NO SPAWNGROUP";
            color = "#ff0000";
        }

        return [text, color];
    }

    public CreateSpawnLabelTextBySpawnID(id: number, show_respawn_time: boolean = false): [string, string]
    {
        const spawn = this.GetEntityByTypeAndID(EQEntity.TYPE_SPAWN, id) as Spawn;

        if (!spawn)
            return ['MISSING LABEL', "#ffffff"];

        return this.CreateSpawnLabelText(spawn.data, show_respawn_time);
    }

    public CreateTrapLabelText(trap: ITrapData): string
    {
        let text = '';

        switch (trap.effect)
        {
            case 0:
                text = `Trap_${trap.id}: Spell(${trap.spell_name}, ${trap.chance}%)`;
                break;
            case 1:
                text = `Trap_${trap.id}: Alarm(${trap.effectvalue}yds, Aggro ${trap.effectvalue2===0?'ALL':'KOS'}, ${trap.chance}%)`;
                break;
            case 2:
            case 3:
                text = `Trap_${trap.id}: Spawn(${trap.npc_name} x${trap.effectvalue2}, ${trap.chance}%)`;
                break;
            case 4:
                text = `Trap_${trap.id}: Damage(${trap.effectvalue}-${trap.effectvalue2}, ${trap.chance}%)`;
                break;
            default:
                text =`Trap_${trap.id}: UNKNOWN EFFECT`;
                break;
        }

        return text;
    }

    private GetEntityByTypeAndID(type: string, id: number): EQEntity | undefined
    {
        switch (type)
        {
            case EQEntity.TYPE_DOOR:        return find(this._state.zone.doors,          { id });
            case EQEntity.TYPE_GROUNDSPAWN: return find(this._state.zone.ground_spawns,  { id });
            case EQEntity.TYPE_SPAWN:       return find(this._state.zone.spawns,         { id });
            case EQEntity.TYPE_TRAP:        return find(this._state.zone.traps,          { id });
            default:                        return;
        }
    }

    private GetLabelByID(id: number): GUI.Control | undefined
    {
        const controls = this.labels.getDescendants(true, control => control.uniqueId === id);
        if (controls.length)
            return controls[0];
    }
}
