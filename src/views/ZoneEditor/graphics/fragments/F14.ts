import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

interface Entry
{
    size:      number;
    datapairs: [number, number][]
}

export class F14 extends BaseFragment
{
    public flags:     number | null;
    public name2:     BaseFragment | string | null;
    public size1:     number | null;
    public size2:     number | null;
    public fragment1: BaseFragment | string | null;
    public params1:   number | null;
    public params2:   number[];
    public entries:   Entry[];
    public fragment2: BaseFragment[];
    public size3:     number | null;
    public name3:     string | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Static or Animated Model";

        this.flags     = null;
        this.name2     = null;
        this.size1     = null;
        this.size2     = null;
        this.fragment1 = null;
        this.params1   = null;
        this.params2   = [];
        this.entries   = [];
        this.fragment2 = [];
        this.size3     = null;
        this.name3     = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F14
    {
        this.name = BaseFragment.GetName(buffer, wld);

        this.flags = buffer.readInt32LE();
        // Bit 0........If 1, Params1 exists.
        // Bit 1........If 1, Params2 exists.
        // Bit 7........If 0, Fragment2 must contain 0.

        this.name2 = wld.GetFragmentReference(buffer.readInt32LE());
        this.size1 = buffer.readInt32LE();
        this.size2 = buffer.readInt32LE();
        this.fragment1 = wld.GetFragmentReference(buffer.readInt32LE());

        if (this.flags & 1)
            this.params1 = buffer.readInt32LE();
        
        if (this.flags & 2)
        {
            for (let i = 0; i < 7; i++)
            {
                this.params2.push(buffer.readInt32LE());
            }
        }

        for (let i = 0; i < this.size1; i++)
        {
            const size = buffer.readInt32LE();
            const datapairs: [number, number][] = [];

            for (let j = 0; j < size; j++) {
                datapairs.push([
                    buffer.readInt32LE(),
                    buffer.readInt32LE()
                ]);
            }

            this.entries.push({
                size,
                datapairs
            });
        }

        for (let i = 0; i < this.size2; i++)
        {
            const ref = wld.GetFragmentReference(buffer.readInt32LE());

            if (ref)
                this.fragment2.push(ref as BaseFragment);
        }

        this.size3 = buffer.readInt32LE();

        if (this.size3 > 0)
            this.name3 = WLDFile.DecodeString(buffer.readBuffer(this.size3));
        
        return this;
    }
}
