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

interface VertexColor
{
    r: number;
    g: number;
    b: number;
    a: number;
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
    public flags:               number;
    public multimaterial:       BaseFragment | null;
    public animated_vertices:   BaseFragment | null;
    public fragment3:           BaseFragment | null;
    public fragment4:           BaseFragment | null;

    public x:                   number;
    public y:                   number;
    public z:                   number;
    public rotation:            number[];
    public max_dist:            number;
    public min_x:               number;
    public min_y:               number;
    public min_z:               number;
    public max_x:               number;
    public max_y:               number;
    public max_z:               number;
    public scale:               number;

    public vertices:            Vertex[];
    public uvs:                 uv[];
    public normals:             VertexNormal[];
    public colors:              VertexColor[];
    public polygons:            Polygon[];
    public vert_pieces:         VertexPiece[];
    public poly_materials:      PolygonMaterial[];
    public vert_materials:      VertexMaterial[];
    public data9_entries:       any[];

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Mesh";
        
        this.flags               = 0;
        this.multimaterial       = null;
        this.animated_vertices   = null;
        this.fragment3           = null;
        this.fragment4           = null;

        this.x                   = 0;
        this.y                   = 0;
        this.z                   = 0;
        this.rotation            = [];
        this.max_dist            = 0;
        this.min_x               = 0;
        this.min_y               = 0;
        this.min_z               = 0;
        this.max_x               = 0;
        this.max_y               = 0;
        this.max_z               = 0;
        this.scale               = 0;

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
        /*const size9               = */buffer.readInt16LE();

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
        for (let j = 0; j < colors_count; j++)
        {
            let dwColor = buffer.readInt32LE();
            let r: number, g: number, b: number, a: number;

            r = dwColor & 0xFF; dwColor >>= 8;
            g = dwColor & 0xFF; dwColor >>= 8;
            b = dwColor & 0xFF; dwColor >>= 8;
            a = dwColor & 0xFF;

            this.colors.push({ r, g, b, a });
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
