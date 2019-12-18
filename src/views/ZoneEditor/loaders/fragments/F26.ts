import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F26 extends ReferenceFragment
{
    public flags:   number | null;
    public unknown: number | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Unknown26 (Particle Reference?)";

        this.flags   = null;
        this.unknown = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F26
    {
        this.name    = BaseFragment.GetName(buffer, wld);
        this.flags   = buffer.readInt32LE();
        this.ref     = ReferenceFragment.GetReference(buffer, wld);
        this.unknown = buffer.readInt32LE();
        return this;
    }
}
