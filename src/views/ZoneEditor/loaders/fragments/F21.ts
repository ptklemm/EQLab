import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F21 extends BaseFragment
{
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "BSP Tree";
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F21 {
        this.name = BaseFragment.GetName(buffer, wld);
        return this;
    }
}
