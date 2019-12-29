import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F34 extends BaseFragment
{
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Unknown 34 (Particle Info?)";
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F34
    {
        this.name = BaseFragment.GetName(buffer, wld);
        return this;
    }
}
