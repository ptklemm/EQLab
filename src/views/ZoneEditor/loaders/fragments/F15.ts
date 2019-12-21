import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F15 extends ReferenceFragment
{
    public flags:     number;
    public fragment1: BaseFragment | string | null;
    public x:         number;
    public y:         number;
    public z:         number;
    public rotate_x:  number;
    public rotate_y:  number;
    public rotate_z:  number;
    public scale_x:   number;
    public scale_y:   number;
    public scale_z:   number;
    public fragment2: BaseFragment | string | null;
    public params2:   number;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Object Location";

        this.flags     = 0;
        this.fragment1 = null;
        this.x         = 0;
        this.y         = 0;
        this.z         = 0;
        this.rotate_x  = 0;
        this.rotate_y  = 0;
        this.rotate_z  = 0;
        this.scale_x   = 0;
        this.scale_y   = 0;
        this.scale_z   = 0;
        this.fragment2 = null;
        this.params2   = 0;
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
