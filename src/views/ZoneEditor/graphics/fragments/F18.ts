import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F18 extends ReferenceFragment
{
    public flags:   number | null;
    public params1: number | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Polygon Animation? Reference";

        this.flags   = null;
        this.params1 = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F18
    {
        this.name = BaseFragment.GetName(buffer, wld);
        this.ref = ReferenceFragment.GetReference(buffer, wld);

        this.flags = buffer.readInt32LE();

        if (this.flags & 1)
            this.params1 = buffer.readFloatLE();

        return this;
    }
}
