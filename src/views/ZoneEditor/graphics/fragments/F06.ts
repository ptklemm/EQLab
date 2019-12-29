import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F06 extends BaseFragment
{
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Two-dimensional Object";
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F06
    {
        this.name = BaseFragment.GetName(buffer, wld);
        return this;
    }
}
