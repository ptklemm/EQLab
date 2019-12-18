import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

interface Vertex
{
    x: number;
    y: number;
    z: number;
}

interface uv
{
    u: number;
    v: number;
}

interface VertexNormal
{
    i: number;
    j: number;
    k: number;
}

interface Polygon
{
    flag:     number;
    vertices: number[];
}

interface VertexPiece
{
    count: number;
    index: number;
}

interface PolygonMaterial
{
    count: number;
    index: number;
}

interface VertexMaterial
{
    count: number;
    index: number;
}

export class F36 extends BaseFragment
{
    public flags:               number | null;
    public multimaterial:       BaseFragment | null;
    public animated_vertices:   BaseFragment | null;
    public fragment3:           BaseFragment | null;
    public fragment4:           BaseFragment | null;

    public x:                   number | null;
    public y:                   number | null;
    public z:                   number | null;
    public rotation:            number[];
    public max_dist:            number | null;
    public min_x:               number | null;
    public min_y:               number | null;
    public min_z:               number | null;
    public max_x:               number | null;
    public max_y:               number | null;
    public max_z:               number | null;
    public scale:               number | null;

    public vertices:            Vertex[];
    public uvs:                 uv[];
    public normals:             VertexNormal[];
    public colors:              number[];
    public polygons:            Polygon[];
    public vert_pieces:         VertexPiece[];
    public poly_materials:      PolygonMaterial[];
    public vert_materials:      VertexMaterial[];
    public data9_entries:       any[];

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Mesh";
        
        this.flags               = null;
        this.multimaterial       = null;
        this.animated_vertices   = null;
        this.fragment3           = null;
        this.fragment4           = null;

        this.x                   = null;
        this.y                   = null;
        this.z                   = null;
        this.rotation            = [];
        this.max_dist            = null;
        this.min_x               = null;
        this.min_y               = null;
        this.min_z               = null;
        this.max_x               = null;
        this.max_y               = null;
        this.max_z               = null;
        this.scale               = null;

        this.vertices            = [];
        this.uvs                 = [];
        this.normals             = [];
        this.colors              = [];
        this.polygons            = [];
        this.vert_pieces         = [];
        this.poly_materials      = [];
        this.vert_materials      = [];
        this.data9_entries       = [];
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F36
    {
        this.name                 = BaseFragment.GetName(buffer, wld);

        this.flags                = buffer.readInt32LE();

        this.multimaterial        = wld.GetFragmentByIndex(buffer.readInt32LE());
        this.animated_vertices    = wld.GetFragmentByIndex(buffer.readInt32LE());
        this.fragment3            = wld.GetFragmentByIndex(buffer.readInt32LE());
        this.fragment4            = wld.GetFragmentByIndex(buffer.readInt32LE());

        this.x                    = buffer.readFloatLE();
        this.y                    = buffer.readFloatLE();
        this.z                    = buffer.readFloatLE();

        this.rotation[0]          = buffer.readInt32LE();
        this.rotation[1]          = buffer.readInt32LE();
        this.rotation[2]          = buffer.readInt32LE();

        this.max_dist             = buffer.readFloatLE();

        this.min_x                = buffer.readFloatLE();
        this.min_y                = buffer.readFloatLE();
        this.min_z                = buffer.readFloatLE();

        this.max_x                = buffer.readFloatLE();
        this.max_y                = buffer.readFloatLE();
        this.max_z                = buffer.readFloatLE();

        const vertex_count        = buffer.readInt16LE();
        const uv_count            = buffer.readInt16LE();
        const normals_count       = buffer.readInt16LE();
        const colors_count        = buffer.readInt16LE();
        const polygon_count       = buffer.readInt16LE();
        const vert_piece_count    = buffer.readInt16LE();
        const poly_material_count = buffer.readInt16LE();
        const vert_material_count = buffer.readInt16LE();
        const size9               = buffer.readInt16LE();

        this.scale                = buffer.readInt16LE();

        // Vertices
        for (let i = 0; i < vertex_count; i++)
        {
            this.vertices.push({
                x: buffer.readInt16LE(),
                y: buffer.readInt16LE(),
                z: buffer.readInt16LE()
            });
        }

        // uv Coords
        if (wld.header?.version === WLDFile.VERSION_1)
        {
            for (let i = 0; i < uv_count; i++)
            {
                this.uvs.push({
                    u: buffer.readInt16LE(),
                    v: buffer.readInt16LE()
                });
            }
        }
        else
        {
            for (let i = 0; i < uv_count; i++)
            {
                this.uvs.push({
                    u: buffer.readInt32LE(),
                    v: buffer.readInt32LE()
                });
            }
        }

        // Vertex Normals
        for (let i = 0; i < normals_count; i++)
        {
            this.normals.push({
                i: buffer.readInt8(),
                j: buffer.readInt8(),
                k: buffer.readInt8()
            });
        }

        // Vertex Colors
        for (let i = 0; i < colors_count; i++)
        {
            this.colors.push(buffer.readInt32LE());
        }

        // Polygons
        for (let i = 0; i < polygon_count; i++)
        {
            this.polygons.push({
                flag: buffer.readInt16LE(),
                vertices: [
                    buffer.readInt16LE(),
                    buffer.readInt16LE(),
                    buffer.readInt16LE()
                ]
            });
        }

        // Vertex Pieces
        for (let i = 0; i < vert_piece_count; i++)
        {
            this.vert_pieces.push({
                count: buffer.readInt16LE(),
                index: buffer.readInt16LE()
            });
        }

        // Polygon Materials
        for (let i = 0; i < poly_material_count; i++)
        {
            this.poly_materials.push({
                count: buffer.readInt16LE(),
                index: buffer.readInt16LE()
            });
        }

        // Vertex Materials
        for (let i = 0; i < vert_material_count; i++)
        {
            this.vert_materials.push({
                count: buffer.readInt16LE(),
                index: buffer.readInt16LE()
            });
        }

        // Data9
        // Need more info here, skip for now
        // for (let i = 0; i < this.size9; i++) {
        // const type = buffer.readInt32LE();
        // let vertexIndex, offset;
        // if (type < 4) {
        //     vertexIndex = buffer.readInt32LE();
        // } else if (type === 4) {
        //     offset = buffer.readFloatLE();
        // }
        // const params = [
        //     buffer.readInt16LE(),
        //     buffer.readInt16LE()
        // ];
        // this.data6Entries.push({
        //     type,
        //     vertexIndex,
        //     offset,
        //     params
        // });
        // }

        this.GoToEnd(buffer);

        return this;
    }
}
