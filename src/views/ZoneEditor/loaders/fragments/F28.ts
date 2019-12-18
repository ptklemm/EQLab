import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F28 extends ReferenceFragment
{
    public flags:  number | null;
    public x:      number | null;
    public y:      number | null;
    public z:      number | null;
    public radius: number | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Point Light";

        this.flags  = null;
        this.x      = null;
        this.y      = null;
        this.z      = null;
        this.radius = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F28 {
        this.name = BaseFragment.GetName(buffer, wld);
        this.ref = ReferenceFragment.GetReference(buffer, wld);

        this.flags  = buffer.readInt32LE();
        this.x      = buffer.readFloatLE();
        this.y      = buffer.readFloatLE();
        this.z      = buffer.readFloatLE();
        this.radius = buffer.readFloatLE();

        return this;
    }
}
