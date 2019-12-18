import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

interface RGBAColor
{
    r: number;
    g: number;
    b: number;
    a: number;
}

export class F32 extends BaseFragment
{
    public data1:         number | null;
    public data2:         number | null;
    public data3:         number | null;
    public data4:         number | null;
    public vertex_colors: any[];

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Vertex Color";

        this.data1         = null;
        this.data2         = null;
        this.data3         = null;
        this.data4         = null;
        this.vertex_colors = [];
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F32
    {
        this.name = BaseFragment.GetName(buffer, wld);

        this.data1   = buffer.readInt32LE();
        const count1 = buffer.readInt32LE();
        this.data2   = buffer.readInt32LE();
        this.data3   = buffer.readInt32LE();
        this.data4   = buffer.readInt32LE();

        for (let i = 0; i < count1; i++)
        {
            let dwColor = buffer.readInt32LE();
            let r: number, g: number, b: number, a: number;

            r = dwColor & 0xFF; dwColor >>= 8;
            g = dwColor & 0xFF; dwColor >>= 8;
            b = dwColor & 0xFF; dwColor >>= 8;
            a = dwColor & 0xFF;

            this.vertex_colors.push({ r, g, b, a });
        }

        return this;
    }
}
