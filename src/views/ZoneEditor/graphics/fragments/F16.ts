import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F16 extends BaseFragment
{
    public params: number | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Zone Unknown";

        this.params = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F16
    {
        this.name = BaseFragment.GetName(buffer, wld);

        this.params = buffer.readFloatLE();

        return this;
    }
}
