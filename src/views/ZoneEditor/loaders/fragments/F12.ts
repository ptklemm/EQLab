import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

interface BoneAnimationFlags
{
    bit0: boolean;
    bit1: boolean;
    bit2: boolean;
    bit3: boolean;
}

interface BoneFrame
{
    rotate:   number;
    rotate_x: number;
    rotate_y: number;
    rotate_z: number;
    shift_x:  number;
    shift_y:  number;
    shift_z:  number;
    shift:    number;
}

export class F12 extends BaseFragment
{
    public flags:  BoneAnimationFlags;
    public frames: BoneFrame[];
    public data2:  any[];

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Bone Animation";

        this.flags = {
            bit0: false,
            bit1: false,
            bit2: false,
            bit3: false
        }
        this.frames = [];
        this.data2 = [];
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F12
    {
        this.name = BaseFragment.GetName(buffer, wld);

        const flags = buffer.readInt32LE();

        this.flags.bit0 = flags & 1 ? true : false;
        this.flags.bit1 = flags & 2 ? true : false;
        this.flags.bit2 = flags & 4 ? true : false;
        this.flags.bit3 = flags & 8 ? true : false;

        const frame_count = buffer.readInt32LE();

        for (let i = 0; i < frame_count; i++)
        {
            this.frames.push({
                rotate:   buffer.readInt16LE(),
                rotate_x: buffer.readInt16LE(),
                rotate_y: buffer.readInt16LE(),
                rotate_z: buffer.readInt16LE(),
                shift_x:  buffer.readInt16LE(),
                shift_y:  buffer.readInt16LE(),
                shift_z:  buffer.readInt16LE(),
                shift:    buffer.readInt16LE()
            });
        }

        // Data2, need more info, skip for now
        // if (this.flags.bit3 === 1) {
        //     for (let i = 0; i < this.numFrames; i++) {
        //         this.data2.push({
        //             param1: buffer.readInt32LE(),
        //             param2: buffer.readInt32LE(),
        //             param3: buffer.readInt32LE(),
        //             param4: buffer.readInt32LE()
        //         });
        //     }
        // }

        this.GoToEnd(buffer);

        return this;
    }
}
