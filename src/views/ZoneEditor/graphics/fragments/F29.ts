import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F29 extends BaseFragment
{
    public flags:   number | null;
    public regions: number[];
    public data2:   number[];

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Region Flag";

        this.flags   = null;
        this.regions = [];
        this.data2   = [];
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F29
    {
        this.name = BaseFragment.GetName(buffer, wld);

        this.flags = buffer.readInt32LE();

        const count1 = buffer.readInt32LE();

        for (let i = 0; i < count1; i++)
        {
            this.regions.push(buffer.readInt32LE());
        }

        const count2 = buffer.readInt32LE();

        for (let i = 0; i < count2; i++)
        {
            this.data2.push(buffer.readInt8());
        }

        return this;
    }
}
