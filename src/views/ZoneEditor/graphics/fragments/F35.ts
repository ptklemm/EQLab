import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F35 extends BaseFragment
{
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "First Fragment";
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F35
    {
        this.name = BaseFragment.GetName(buffer, wld);
        return this;
    }
}
