import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

interface SkeletonFlags
{
    bit0: boolean;
    bit1: boolean;
    bit9: boolean;
}

export class Bone
{
    public name:      BaseFragment | string | null;
    public flags:     number;
    public animation: BaseFragment | string | null;
    public mesh:      BaseFragment | string | null;
    public children:  any[];

    constructor(name: BaseFragment | string | null, flags: number,
        animation: BaseFragment | string | null, mesh: BaseFragment | string | null)
    {
        this.name      = name;
        this.flags     = flags;
        this.animation = animation;
        this.mesh      = mesh;
        this.children  = [];
    }
}

export class F10 extends BaseFragment
{
    public flags:     SkeletonFlags;
    public fragment1: BaseFragment | string | null;
    public params1:   [number, number, number] | null;
    public params2:   number | null;
    public bones:     Bone[];
    public meshes:    BaseFragment[];
    public data3:     number[];

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Skeleton";

        this.flags = {
            bit0: false,
            bit1: false,
            bit9: false
        }
        this.fragment1 = null;
        this.params1   = null;
        this.params2   = null;
        this.bones     = [];
        this.meshes    = [];
        this.data3     = [];
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F10
    {
        this.name = BaseFragment.GetName(buffer, wld);

        const flags     = buffer.readInt32LE();
        this.flags.bit0 = flags & 1   ? true : false;
        this.flags.bit1 = flags & 2   ? true : false;
        this.flags.bit9 = flags & 512 ? true : false;

        const bone_count = buffer.readInt32LE();
        this.fragment1 = wld.GetFragmentByIndex(buffer.readInt32LE());

        if (this.flags.bit0)
        {
            this.params1 = [
                buffer.readInt32LE(),
                buffer.readInt32LE(),
                buffer.readInt32LE()
            ];
        }

        if (this.flags.bit1)
        {
            this.params2 = buffer.readFloatLE();
        }

        for (let i = 0; i < bone_count; i++)
        {
            const bone = new Bone(
                wld.GetFragmentReference(buffer.readInt32LE()),
                buffer.readInt32LE(),
                wld.GetFragmentByIndex(buffer.readInt32LE()),
                wld.GetFragmentByIndex(buffer.readInt32LE()),
            );

            const children_count = buffer.readInt32LE();

            for (let j = 0; j < children_count; j++)
            {
                bone.children.push(buffer.readInt32LE());
            }

            this.bones.push(bone);
        }

        if (this.flags.bit9)
        {
            const mesh_count = buffer.readInt32LE();

            for (let i = 0; i < mesh_count; i++)
            {
                this.meshes.push(wld.GetFragmentByIndex(buffer.readInt32LE()) as BaseFragment);
            }

            for (let i = 0; i < mesh_count; i++)
            {
                this.data3.push(buffer.readInt32LE());
            }
        }

        return this;
    }
}
