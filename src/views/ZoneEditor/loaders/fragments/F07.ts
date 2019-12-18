import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F07 extends ReferenceFragment
{
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Two-dimensional Object Reference";
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F07
    {
        this.name = BaseFragment.GetName(buffer, wld);
        this.ref = ReferenceFragment.GetReference(buffer, wld);
        return this;
    }
}