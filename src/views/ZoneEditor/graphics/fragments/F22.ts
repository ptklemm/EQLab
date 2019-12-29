import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F22 extends BaseFragment
{
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "BSP Region";
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F22 {
        this.name = BaseFragment.GetName(buffer, wld);
        return this;
    }
}
