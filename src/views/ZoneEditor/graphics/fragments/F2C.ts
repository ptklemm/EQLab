import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F2C extends BaseFragment
{
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Alternate Mesh";
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F2C {
        this.name = BaseFragment.GetName(buffer, wld);
        return this;
    }
}
