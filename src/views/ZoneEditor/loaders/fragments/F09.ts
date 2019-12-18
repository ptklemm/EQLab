import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F09 extends ReferenceFragment
{
    public flags: number | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Camera Reference";

        this.flags = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F09
    {
        this.name = BaseFragment.GetName(buffer, wld);
        this.ref = ReferenceFragment.GetReference(buffer, wld);

        this.flags = buffer.readInt32LE();

        return this;
    }
}
