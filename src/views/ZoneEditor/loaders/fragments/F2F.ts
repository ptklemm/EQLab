import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F2F extends ReferenceFragment
{
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Mesh Animated Vertices Reference";
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F2F {
        this.name = BaseFragment.GetName(buffer, wld);
        this.ref = ReferenceFragment.GetReference(buffer, wld);
        return this;
    }
}
