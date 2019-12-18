import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F05 extends ReferenceFragment
{
    public flags: number | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Texture Info Reference";

        this.flags = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F05
    {
        this.name = BaseFragment.GetName(buffer, wld);
        this.ref = ReferenceFragment.GetReference(buffer, wld);

        this.flags = buffer.readInt32LE();

        return this;
    }
}
