import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F2A extends ReferenceFragment
{
    public flags:        number | null;
    public region_count: number | null;
    public regions:      any[];

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Ambient Light";

        this.flags        = null;
        this.region_count = null;
        this.regions      = [];
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F2A
    {
        this.name = BaseFragment.GetName(buffer, wld);
        this.ref = ReferenceFragment.GetReference(buffer, wld);

        this.flags        = buffer.readInt32LE();
        this.region_count = buffer.readInt32LE();

        for (let i = 0; i < this.region_count; i++)
        {
            this.regions.push(buffer.readInt32LE());
        }

        return this;
    }
}