import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F15 extends ReferenceFragment
{
    public flags:     number | null;
    public fragment1: BaseFragment | string | null;
    public x:         number | null;
    public y:         number | null;
    public z:         number | null;
    public rotate_x:  number | null;
    public rotate_y:  number | null;
    public rotate_z:  number | null;
    public scale_x:   number | null;
    public scale_y:   number | null;
    public scale_z:   number | null;
    public fragment2: BaseFragment | string | null;
    public params2:   number | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Object Location";

        this.flags     = null;
        this.fragment1 = null;
        this.x         = null;
        this.y         = null;
        this.z         = null;
        this.rotate_x  = null;
        this.rotate_y  = null;
        this.rotate_z  = null;
        this.scale_x   = null;
        this.scale_y   = null;
        this.scale_z   = null;
        this.fragment2 = null;
        this.params2   = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F15 {
        this.name = BaseFragment.GetName(buffer, wld);
        this.ref = ReferenceFragment.GetReference(buffer, wld);

        this.flags     = buffer.readInt32LE();
        this.fragment1 = wld.GetFragmentReference(buffer.readInt32LE());

        this.x         = buffer.readFloatLE();
        this.y         = buffer.readFloatLE();
        this.z         = buffer.readFloatLE();

        this.rotate_x  = buffer.readFloatLE();
        this.rotate_y  = buffer.readFloatLE();
        this.rotate_z  = buffer.readFloatLE();

        this.scale_x   = buffer.readFloatLE();
        this.scale_y   = buffer.readFloatLE();
        this.scale_z   = buffer.readFloatLE();

        const index = buffer.readInt32LE();
        this.fragment2 = wld.GetFragmentReference(index);

        if (index !== 0 && this.fragment2)
            this.params2 = buffer.readInt32LE();

        return this;
    }
}
