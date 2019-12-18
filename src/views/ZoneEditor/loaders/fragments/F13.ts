import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

interface BoneAnimationReferenceFlags
{
    bit0: boolean;
    bit1: boolean;
    bit2: boolean;
}

export class F13 extends ReferenceFragment
{
    public flags: BoneAnimationReferenceFlags;
    public params1: number | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Bone Animation Reference";

        this.flags = {
            bit0: false,
            bit1: false,
            bit2: false
        }
        this.params1 = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F13
    {
        this.name = BaseFragment.GetName(buffer, wld);
        this.ref = ReferenceFragment.GetReference(buffer, wld);

        const flags = buffer.readInt32LE();

        this.flags.bit0 = flags & 1 ? true: false;
        this.flags.bit1 = flags & 2 ? true: false;
        this.flags.bit2 = flags & 4 ? true: false;

        if (this.flags.bit0)
            this.params1 = buffer.readInt32LE();

        return this;
    }
}
