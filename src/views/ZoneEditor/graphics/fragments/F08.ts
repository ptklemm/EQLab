import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F08 extends BaseFragment
{
    public params1:  number | null;
    public params2:  number | null;
    public params5:  number | null;
    public params6:  number | null;
    public params8:  number | null;
    public params9:  number | null;
    public params11: number | null;
    public params12: number | null;
    public params14: number | null;
    public params15: number | null;
    public params16: number | null;
    public params20: number | null;
    public params21: number | null;
    public params22: number | null;
    public params24: number | null;
    public params25: number | null;
    public params26: number | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Camera";

        this.params1  = null;
        this.params2  = null;
        this.params5  = null;
        this.params6  = null;
        this.params8  = null;
        this.params9  = null;
        this.params11 = null;
        this.params12 = null;
        this.params14 = null;
        this.params15 = null;
        this.params16 = null;
        this.params20 = null;
        this.params21 = null;
        this.params22 = null;
        this.params24 = null;
        this.params25 = null;
        this.params26 = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F08
    {
        this.name = BaseFragment.GetName(buffer, wld);

        this.params1 = buffer.readInt32LE();
        this.params2 = buffer.readInt32LE();
        buffer.readBuffer(4);
        buffer.readBuffer(4);
        this.params5 = buffer.readFloatLE();
        this.params6 = buffer.readFloatLE();
        buffer.readBuffer(4);
        this.params8 = buffer.readFloatLE();
        this.params9 = buffer.readFloatLE();
        buffer.readBuffer(4);
        this.params11 = buffer.readFloatLE();
        this.params12 = buffer.readFloatLE();
        buffer.readBuffer(4);
        this.params14 = buffer.readFloatLE();
        this.params15 = buffer.readFloatLE();
        this.params16 = buffer.readFloatLE();
        buffer.readBuffer(4);
        buffer.readBuffer(4);
        buffer.readBuffer(4);
        this.params20 = buffer.readInt32LE();
        this.params21 = buffer.readInt32LE();
        this.params22 = buffer.readInt32LE();
        buffer.readBuffer(4);
        this.params24 = buffer.readInt32LE();
        this.params25 = buffer.readInt32LE();
        this.params26 = buffer.readInt32LE();

        return this;
    }
}
