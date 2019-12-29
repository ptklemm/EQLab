import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F11 extends ReferenceFragment
{
    public params1: number | null;
    
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Skeleton Reference";

        this.params1 = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F11
    {
        this.name = BaseFragment.GetName(buffer, wld);
        this.ref = ReferenceFragment.GetReference(buffer, wld);

        this.params1 = buffer.readInt32LE();

        return this;
    }
}
