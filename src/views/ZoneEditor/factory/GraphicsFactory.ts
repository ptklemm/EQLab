import * as BABYLON   from 'babylonjs';
import _              from 'lodash';
import Jimp           from 'jimp/es';
import toArrayBuffer  from 'to-arraybuffer';
import FileLoader     from '../loaders/FileLoader';
import { PFSFile }    from '../loaders/PFS';
import WLDFile        from '../loaders/WLD';
import * as FRAGMENTS from '../loaders/fragments';
import { Bone }       from '../loaders/fragments/F10';

export default class GraphicsFactory
{
    public static readonly BMP_SIGNATURE = 0x4D42;
    public static readonly JPG_SIGNATURE = 0xD8FF;
    public static readonly PNG_SIGNATURE = 0x474E5089;
    public static readonly DDS_SIGNATURE = 0x20534444;

    public default_material:    BABYLON.StandardMaterial;
    public default_mesh_length: number;

    public default_spawn_mesh:  BABYLON.Mesh;
    public default_door_mesh:   BABYLON.Mesh;

    private _scene:             BABYLON.Scene;
    private _file_loader:       FileLoader;
    private _textures:          PFSFile[];
    private _highlight_layer:   BABYLON.HighlightLayer;
    private _octree:            BABYLON.Octree<BABYLON.AbstractMesh> | null;

    constructor(file_loader: FileLoader, scene: BABYLON.Scene, highlight_layer: BABYLON.HighlightLayer)
    {
        this._file_loader     = file_loader;
        this._scene           = scene;
        this._textures        = [];
        this._highlight_layer = highlight_layer;
        this._octree          = null;

        this.default_mesh_length = 5;

        this.default_material = new BABYLON.StandardMaterial("DefaultMaterial", scene);
        this._scene.defaultMaterial = this.default_material;

        this.default_spawn_mesh = BABYLON.MeshBuilder.CreateCylinder("DefaultSpawnMesh", {
            diameterTop: 0,
            height: this.default_mesh_length,
            diameterBottom: this.default_mesh_length * 1.1,
            tessellation: 4
        }, this._scene);

        this.default_spawn_mesh.bakeTransformIntoVertices(BABYLON.Matrix.RotationX(BABYLON.Tools.ToRadians(90)));
        this.default_spawn_mesh.material = this.default_material;
        this.default_spawn_mesh.setEnabled(false);
        this.default_spawn_mesh.freezeWorldMatrix();

        this.default_door_mesh = BABYLON.MeshBuilder.CreatePlane("DefaultDoorMesh", {
            size: this.default_mesh_length * 10,
        }, scene);
        this.default_door_mesh.material = this.default_material;
        this.default_door_mesh.setEnabled(false);
        this.default_door_mesh.freezeWorldMatrix();
    }

    public set octree(octree: BABYLON.Octree<BABYLON.AbstractMesh>)
    {
        this._octree = octree;
    }

    public InstanceSpawn(id: number): BABYLON.InstancedMesh
    {
        return this.default_spawn_mesh.createInstance(`spawn_${id}`);
    }

    public async LoadGlobalGraphics()
    {

    }

    public async LoadZone(zone_short_name: string | null)
    {
        if (!zone_short_name)
            return null;

        // Load Archives
        const archives = await this._file_loader.LoadZoneArchives(zone_short_name);

        // Load Textures
        this._textures = archives.zone_PFS.GetTextures().concat(archives.obj_PFS.GetTextures()).concat(archives.chr_PFS.GetTextures());

        // Load WLDs
        const [zone_WLD_data, placements_WLD_data] = archives.zone_PFS.GetMainWLD();
        const object_WLD_data = archives.obj_PFS.GetMainWLD();
        // const character_WLD_data = archives.chr_PFS.GetMainWLD();

        // Zone PFS
        const zone_WLD = new WLDFile(zone_WLD_data).Load();
        const placements_WLD = new WLDFile(placements_WLD_data).Load();
        // const lights_WLD = new WLDFile(lights_WLD_data).Load();
        const zone_model = await this.CreateZoneModel(zone_WLD);
        // this.CreateZoneLights(lightsWLD);

        // Object PFS
        const object_WLD = new WLDFile(object_WLD_data).Load();
        await this.CreateZoneObjects(object_WLD, placements_WLD);

        // Character PFS
        // const character_WLD = new WLDFile(character_WLD_data).Load();
        // this.CreateCharacters(characterWLD);

        // Read zone_chr.txt

        this._textures = [];

        return zone_model;
    }

    public async CreateZoneModel(zoneWLD: WLDFile): Promise<BABYLON.Mesh>
    {
        const f31s = zoneWLD.GetFragmentsByType(0x31) as FRAGMENTS.F31[];
        await this.CreateMultiMaterial(f31s[0]);

        // const f15 = zoneWLD.GetFragmentsByType(0x15)[0] as FRAGMENTS.F15;
        // const f14 = f15.ref;
        // const F16 = f15.fragment1;
        const f36s = zoneWLD.GetFragmentsByType(0x36) as FRAGMENTS.F36[];

        const model = this.CreateStaticModel("ZoneModel", f36s, f31s[0].name);
        BABYLON.Tags.EnableFor(model);
        BABYLON.Tags.AddTagsTo(model, "ZoneModel");

        return model;
    }
    
    public async CreateZoneObjects(obj_WLD: WLDFile, placements_WLD: WLDFile): Promise<void>
    {
        const f31s = obj_WLD.GetFragmentsByType(0x31) as FRAGMENTS.F31[];
        
        for (const f31 of f31s)
        {
            await this.CreateMultiMaterial(f31);
        }

        const f14s = obj_WLD.GetFragmentsByType(0x14) as FRAGMENTS.F14[];
        const f15s = placements_WLD.GetFragmentsByType(0x15) as FRAGMENTS.F15[];
        const rotScale = 1 / 512.0 * 360.0;

        for (const f14 of f14s)
        {
            const ref = f14.fragment2[0] as any;
            const animated = ref.type === 0x11;

            let model: BABYLON.Mesh;

            if (!animated)
            {
                const f36 = ref.ref as FRAGMENTS.F36;
                model = this.CreateStaticModel(f14.name, [f36], f36.multimaterial?.name as string) as BABYLON.Mesh;
            }
            else
            {
                const f10 = ref.ref as FRAGMENTS.F10;
                model = this.CreateAnimatedModel(f14.name, f10);
            }

            model.freezeWorldMatrix();
            model.setEnabled(false);

            const placements = f15s.filter(f15 => f15.ref === f14.name);

            for (let i = 0; i < placements.length; i++)
            {
                const f15 = placements[i];
                const x = f15.x;
                const y = f15.z;
                const z = f15.y;

                const rotate_x = -f15.rotate_z * rotScale;
                const rotate_y = -f15.rotate_x * rotScale;
                const rotate_z = -f15.rotate_y * rotScale;

                const rotate_x_radians = BABYLON.Angle.FromDegrees(rotate_x).radians();
                const rotate_y_radians = BABYLON.Angle.FromDegrees(rotate_y).radians();
                const rotate_z_radians = BABYLON.Angle.FromDegrees(rotate_z).radians();

                const scale_x = f15.scale_x === 0 ? f15.scale_y : f15.scale_x;
                const scale_y = f15.scale_y;
                const scale_z = f15.scale_z;

                const instance = model.createInstance(`${f15.ref}_${i}`);
                instance.position = new BABYLON.Vector3(x, y, z);
                instance.scaling = new BABYLON.Vector3(scale_x, scale_y, scale_z);
                instance.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(rotate_y_radians, rotate_z_radians, rotate_x_radians);
            
                instance.freezeWorldMatrix();
            }
        }
    }

    private async CreateMultiMaterial(f31: FRAGMENTS.F31): Promise<BABYLON.MultiMaterial>
    {
        const existing_material = this.GetMultiMaterialByName(f31.name);
        if (existing_material)
            return existing_material;
        
        const multimaterial = new BABYLON.MultiMaterial(f31.name, this._scene);

        for (let i = 0; i < f31.materials.length; i++)
        {
            const f30 = f31.materials[i] as FRAGMENTS.F30;
            const material = await this.CreateMaterial(f30)
            multimaterial.subMaterials.push(material);
        }

        multimaterial.freeze();

        return multimaterial;
    }

    private async CreateMaterial(f30: FRAGMENTS.F30): Promise<BABYLON.Material>
    {
        const existing_material = this._scene.getMaterialByName(f30.name);
        if (existing_material)
            return existing_material;

        const material = new BABYLON.StandardMaterial(f30.name, this._scene);
        BABYLON.Tags.EnableFor(material);

        const { invisible, masked, particle } = f30.visibility;

        let texture: BABYLON.Texture | null = null;

        if (invisible)
        {
            // Invisible materials have no texture
            BABYLON.Tags.AddTagsTo(material, 'Invisible');
            material.alpha           = 0.1;
            material.backFaceCulling = false;
        }
        else
        {
            const f05 = f30.ref as FRAGMENTS.F05;
            const f04 = f05.ref as FRAGMENTS.F04;

            if (!f04.is_animated)
            {
                texture = await this.CreateStaticTexture(f04.refs[0] as FRAGMENTS.F03, masked);
            }
            else
            {
                texture = await this.CreateAnimatedTexture(f04, masked);
            }
        }

        if (texture)
        {
            material.diffuseTexture = texture;
            material.diffuseTexture.hasAlpha = true;

            if (particle)
            {
                material.opacityTexture = material.diffuseTexture;
                material.alphaMode = BABYLON.Engine.ALPHA_ADD
            }
        }

        material.ambientColor = new BABYLON.Color3(1, 1, 1);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        material.sideOrientation = BABYLON.Material.ClockWiseSideOrientation;

        return material;
    }

    private async CreateStaticTexture(f03: FRAGMENTS.F03, masked: boolean): Promise<BABYLON.Texture | null>
    {
        const texture_name   = f03.entries[0].toLowerCase();
        const texture_file   = _.find(this._textures, { name: texture_name });
        
        if (!texture_file)
            return null;

        const texture_format = this.GetTextureFormat(texture_file);
        
        let texture_buffer: ArrayBuffer;

        if (texture_format === 'BMP' && masked)
        {
            texture_buffer = toArrayBuffer(await this.ProcessBMP(texture_file.buffer, masked));
        }
        else
        {
            texture_buffer = toArrayBuffer(texture_file.buffer);
        }
        
        const invert_y = texture_format === 'DDS';

        const texture =  new BABYLON.Texture('data:' + texture_name, this._scene, false, invert_y,
            BABYLON.Texture.TRILINEAR_SAMPLINGMODE, null, null, texture_buffer, true);

        return texture;
    }

    private async CreateAnimatedTexture(f04: FRAGMENTS.F04, masked: boolean): Promise<BABYLON.Texture | null>
    {
        const texture_name = f04.name;
        const image_files: Jimp[] = [];
        const formats: string[] = [];

        for (let i = 0; i < f04.refs.length; i++)
        {
            const f03 = f04.refs[i] as FRAGMENTS.F03;
            const image_name = f03.entries[0].toLowerCase();
            const image_file = _.find(this._textures, { name: image_name });

            if (image_file)
            {
                formats.push(image_file.name.slice(image_file.name.lastIndexOf('.')));
                image_files.push(await Jimp.read(image_file.buffer));
            }
        }

        if (!image_files.length)
            return null;

        const num_files = image_files.length;
        const is_square = num_files > 0 && Math.sqrt(num_files) % 1 === 0;
        const is_even   = num_files > 0 && num_files % 2 === 0;
        const width     = image_files[0].bitmap.width;
        const height    = image_files[0].bitmap.height;

        let num_rows: number, num_cols: number, tiles: number;

        if (is_square)
        {
            num_rows = Math.sqrt(num_files);
            num_cols = num_rows;
            tiles = num_rows;
        }
        else
        {
            if (is_even)
            {
                num_rows = 2;
                num_cols = num_files / 2;
            }
            else
            {
                num_rows = 1;
                num_cols = num_files;
            }

            tiles = num_cols;
        }

        const new_image = new Jimp(width * num_cols, height * num_rows);

        for (let i = 0; i < num_files; i++)
        {
            const row = Math.floor(i / tiles);
            const col = i % tiles;

            let image = image_files[i];
            const format = formats[i];

            if (masked && format === '.bmp')
            {
                image = this.MaskBMP(image);
            }

            new_image.composite(image, col * width, row * width);  
        }

        const texture_buffer = toArrayBuffer(await new_image.getBufferAsync(Jimp.MIME_PNG));

        const texture =  new BABYLON.Texture('data:' + texture_name, this._scene, false, false,
            BABYLON.Texture.TRILINEAR_SAMPLINGMODE, null, null, texture_buffer, true);
        
        texture.uScale  = 1 / num_cols;
        texture.vScale  = 1 / num_rows;
        texture.uOffset = 0;
        texture.vOffset = is_even ? 1 / num_rows : 0; // as our starting tile is on top left of the texture

        return texture;
    }

    private GetTextureFormat(file: PFSFile): string
    {
        let format = '';

        const dds_png_Buffer = Buffer.from(file.buffer).slice(0, 4).readInt32LE(0);
        const bmp_jpg_Buffer = Buffer.from(file.buffer).slice(0, 2).readInt16LE(0);
    
        if      (dds_png_Buffer === GraphicsFactory.DDS_SIGNATURE) { format = 'DDS'; }
        else if (dds_png_Buffer === GraphicsFactory.PNG_SIGNATURE) { format = 'PNG'; }
        else if (bmp_jpg_Buffer === GraphicsFactory.BMP_SIGNATURE) { format = 'BMP'; }
        else if (bmp_jpg_Buffer === GraphicsFactory.JPG_SIGNATURE) { format = 'JPG'; }

        return format;
    }

    private async ProcessBMP(buffer: Buffer, masked: boolean): Promise<Buffer>
    {
        let image = await Jimp.read(buffer);

        if (masked)
        {
            image = this.MaskBMP(image);
        }

        return await image.getBufferAsync(Jimp.MIME_PNG);
    }

    private MaskBMP(image: Jimp): Jimp
    {
        const mask = Jimp.intToRGBA(image.getPixelColor(image.bitmap.width, image.bitmap.height)); // get last pixel
    
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const r = image.bitmap.data[idx + 0];
            const g = image.bitmap.data[idx + 1];
            const b = image.bitmap.data[idx + 2];

            if (r === mask.r && g === mask.g && b === mask.b)
            {
                image.bitmap.data[idx + 3] = 0; // Alpha
            }
        });

        return image;
    }

    private CreateStaticModel(name: string, f36s: FRAGMENTS.F36[], material_name: string): BABYLON.Mesh
    {
        const model = new BABYLON.Mesh(name, this._scene);
        model.material = this.GetMultiMaterialByName(material_name) || null;

        let index = 0, vertex_index = 0;
        const indices:   any[] = [];
        const positions: any[] = [];
        const normals:   any[] = [];
        const uvs:       any[] = [];
        const submeshes: any[] = [];

        const nScale  = 1 / 127;
        const uvScale = 1 / 256;

        for (const f36 of f36s)
        {
            const vScale  = 1.0 / (1 << f36.scale);

            for (const polygon of f36.polygons)
            {
                for (const vi of polygon.vertices)
                {
                    const vertex = f36.vertices[vi];
                    const normal = f36.normals[vi];
                    const uv     = f36.uvs[vi];

                    indices.push(index);
                    
                    // Swap y and z
                    positions.push(f36.x + (vertex.x * vScale));
                    positions.push(f36.z + (vertex.z * vScale));
                    positions.push(f36.y + (vertex.y * vScale));

                    normals.push(normal.i * nScale);
                    normals.push(normal.j * nScale);
                    normals.push(normal.k * nScale);

                    uvs.push(uv ? uv.u * uvScale      : 0);
                    uvs.push(uv ? uv.v * uvScale * -1 : 0);

                    index++;
                }
            }

            for (const poly_material of f36.poly_materials)
            {
                const poly_count     = poly_material.count;
                const vertex_count   = poly_count * 3;
                const material_index = poly_material.index;
    
                submeshes.push({ material_index, vertex_start: vertex_index, vertex_count })
    
                vertex_index += vertex_count;
            }
        }

        const vertex_data = new BABYLON.VertexData();

        vertex_data.indices   = indices;
        vertex_data.positions = positions;
        vertex_data.normals   = normals;
        vertex_data.uvs       = uvs;

        vertex_data.applyToMesh(model, true);

        model.subMeshes = [];
        const vertices_count = model.getTotalVertices();

        for (const submesh of submeshes)
        {
            new BABYLON.SubMesh(
                submesh.material_index,
                0,
                vertices_count,
                submesh.vertex_start,
                submesh.vertex_count,
                model
            );
        }
        
        return model;
    }

    private CreateAnimatedModel(name: string, f10: FRAGMENTS.F10): BABYLON.Mesh
    {
        const model = new BABYLON.Mesh(name, this._scene);
        model.material = this.GetAnimatedModelMultiMaterial(f10) || null;

        let index = 0, vertex_index = 0;
        let indices:   any[] = [];
        let positions: any[] = [];
        let normals:   any[] = [];
        let uvs:       any[] = [];
        let submeshes: any[] = [];

        // Create static meshes
        for (let i = 0, len = f10.meshes.length; i < len; i++)
        {
            const f36 = f10.meshes[i] as FRAGMENTS.F36;
            const data = this.CreateStaticMesh(f36, index, vertex_index);

            index        = data.index;
            vertex_index = data.vertex_index;
            indices      = indices.concat(data.vertex_data.indices);
            positions    = positions.concat(data.vertex_data.positions);
            normals      = normals.concat(data.vertex_data.normals);
            uvs          = uvs.concat(data.vertex_data.uvs);
            submeshes    = submeshes.concat(data.submeshes);
        }

        // Create animated meshes, combined into 1 larger mesh
        const data = this.CreateAnimatedMesh(
            f10.bones[0],
            f10.bones,
            null,
            index,
            vertex_index,
            indices,
            positions,
            normals,
            uvs,
            submeshes
        );

        submeshes = data.submeshes;

        const vertex_data = new BABYLON.VertexData();

        vertex_data.indices   = data.indices;
        vertex_data.positions = data.positions;
        vertex_data.normals   = data.normals;
        vertex_data.uvs       = data.uvs;

        vertex_data.applyToMesh(model, true);

        model.subMeshes = [];
        const vertices_count = model.getTotalVertices();

        for (const submesh of submeshes)
        {
            new BABYLON.SubMesh(
                submesh.material_index,
                0,
                vertices_count,
                submesh.vertex_start,
                submesh.vertex_count,
                model
            );
        }

        return model;
    }

    private CreateStaticMesh(f36: FRAGMENTS.F36, index: number, vertex_index: number, transform?: BABYLON.Matrix)
    {
        const vScale  = 1.0 / (1 << f36.scale);
        const nScale  = 1 / 127;
        const uvScale = 1 / 256;

        const indices:   number[] = [];
        const positions: number[] = [];
        const normals:   number[] = [];
        const uvs:       number[] = [];
        const submeshes: any[]    = [];

        for (const polygon of f36.polygons)
        {
            for (const vertex_index of polygon.vertices)
            {
                const vertex = f36.vertices[vertex_index];
                const normal = f36.normals[vertex_index];
                const uv     = f36.uvs[vertex_index];

                indices.push(index);
                
                // Swap y and z
                positions.push(f36.x + (vertex.x * vScale));
                positions.push(f36.z + (vertex.z * vScale));
                positions.push(f36.y + (vertex.y * vScale));

                normals.push(normal.i * nScale);
                normals.push(normal.j * nScale);
                normals.push(normal.k * nScale);

                uvs.push(uv ? uv.u * uvScale      : 0);
                uvs.push(uv ? uv.v * uvScale * -1 : 0);

                index++;
            }
        }

        for (const poly_material of f36.poly_materials)
        {
            const poly_count     = poly_material.count;
            const vertex_count   = poly_count * 3;
            const material_index = poly_material.index;

            submeshes.push({ material_index, vertex_start: vertex_index, vertex_count })

            vertex_index += vertex_count;
        }

        let vertex_data = new BABYLON.VertexData();

        vertex_data.indices   = indices;
        vertex_data.positions = positions;
        vertex_data.normals   = normals;
        vertex_data.uvs       = uvs;

        if (transform)
            vertex_data = vertex_data.transform(transform);
     
        return {
            index,
            vertex_index,
            vertex_data,
            submeshes
        }
    }

    private CreateAnimatedMesh(bone: Bone, bones: Bone[], parent_transform_matrix: BABYLON.Matrix | null, index: number, 
        vertex_index: number, indices: any[], positions: any[], normals: any[], uvs: any[], submeshes: any[])
    {
        // Animation, use first frame only for now to create static bone
        const animation_ref = bone.animation as FRAGMENTS.F13;
        const animation     = animation_ref.ref as FRAGMENTS.F12;
        const frame0        = animation.frames[0];

        // Create transform matrix from first frame and parent transform
        const translate_x = frame0.translate_x / frame0.translate;
        const translate_y = frame0.translate_y / frame0.translate;
        const translate_z = frame0.translate_z / frame0.translate;

        const rotate_x = frame0.rotate_x / frame0.rotate;
        const rotate_y = frame0.rotate_y / frame0.rotate;
        const rotate_z = frame0.rotate_z / frame0.rotate;

        const translation = new BABYLON.Vector3(translate_x, translate_z, translate_y); // swap y and z
        const rotation    = BABYLON.Quaternion.RotationYawPitchRoll(rotate_y, rotate_z, rotate_x);

        let transform_matrix = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), rotation, translation);

        if (parent_transform_matrix)
            transform_matrix = transform_matrix.multiply(parent_transform_matrix);

        // Create this bone's mesh if it has one
        if (bone.mesh)
        {
            const mesh_ref = bone.mesh as FRAGMENTS.F2D | FRAGMENTS.F03 | FRAGMENTS.F34;
            if (mesh_ref.type === 0x2D) // MeshRef can also be a F34 Particle Emitter, skip these for now
            {
                //@ts-ignore
                const mesh_frag: FRAGMENTS.F36 | FRAGMENTS.F2C = mesh_ref.ref;
                if (mesh_frag.type === 0x36) // Skip F2C alternate meshes for now
                {
                    const data = this.CreateStaticMesh(mesh_frag as FRAGMENTS.F36, index, vertex_index, transform_matrix);

                    index        = data.index;
                    vertex_index = data.vertex_index;
                    indices      = indices.concat(data.vertex_data.indices);
                    positions    = positions.concat(data.vertex_data.positions);
                    normals      = normals.concat(data.vertex_data.normals);
                    uvs          = uvs.concat(data.vertex_data.uvs);
                    submeshes    = submeshes.concat(data.submeshes);
                }
            }
        }

        // Create child bone meshes
        for (const bone_index of bone.children)
        {
            const bone = bones[bone_index];
            const data = this.CreateAnimatedMesh(bone, bones, transform_matrix, index, vertex_index,
                indices, positions, normals, uvs, submeshes);

            index        = data.index;
            vertex_index = data.vertex_index;
            indices      = data.indices;
            positions    = data.positions;
            normals      = data.normals;
            uvs          = data.uvs;
            submeshes    = data.submeshes;
        }

        return {
            index,
            vertex_index,
            indices,
            positions,
            normals,
            uvs,
            submeshes
        }
    }

    private GetMultiMaterialByName(name: string): BABYLON.MultiMaterial | undefined
    {
        return _.find(this._scene.multiMaterials, { name });
    }

    private GetAnimatedModelMultiMaterial(f10: FRAGMENTS.F10): BABYLON.MultiMaterial | undefined
    {
        const name = f10.name.slice(0, f10.name.indexOf('_')) + '_MP';
        return this.GetMultiMaterialByName(name);
    }
}
