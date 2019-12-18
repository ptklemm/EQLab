import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

interface Vertex
{
    x: number;
    y: number;
    z: number;
}

export class F17 extends BaseFragment
{
    public flags:    number | null;
    public params1:  number | null;
    public params2:  number | null;
    public vertices: Vertex[];
    public polygons: number[][];
    
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Polygon Animation?";

        this.flags    = null;
        this.params1  = null;
        this.params2  = null;
        this.vertices = [];
        this.polygons = [];
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F17
    {
        this.name = BaseFragment.GetName(buffer, wld);

        this.flags         = buffer.readInt32LE();
        const vertex_count = buffer.readInt32LE();
        const poly_count   = buffer.readInt32LE();
        this.params1       = buffer.readFloatLE();
        this.params2       = buffer.readFloatLE();

        for (let i = 0; i < vertex_count; i++)
        {
            this.vertices.push({
                x: buffer.readFloatLE(),
                y: buffer.readFloatLE(),
                z: buffer.readFloatLE()
            });
        }

        for (let i = 0; i < poly_count; i++)
        {
            const size = buffer.readInt32LE();

            const indices: number[] = [];
            for (let j = 0; j < size; j++)
            {
                indices.push(buffer.readInt32LE());
            }

            this.polygons.push(indices);
        }

        return this;
    }
}
