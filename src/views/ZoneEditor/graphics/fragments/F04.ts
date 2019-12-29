import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F04 extends BaseFragment
{
    public flags:        number;
    public is_animated:  boolean;
    public count:        number;
    public milliseconds: number;
    public refs:         BaseFragment[];

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Texture Animation Info";

        this.flags        = 0;
        this.is_animated  = false;
        this.count        = 0;
        this.milliseconds = 0;
        this.refs         = [];
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F04
    {
        this.name = BaseFragment.GetName(buffer, wld);

        this.flags = buffer.readInt32LE();
        this.is_animated = this.flags & 8 ? true : false;
        this.count = buffer.readInt32LE();

        if (this.is_animated)
            this.milliseconds = buffer.readInt32LE();
        
        for (let i = 0; i < this.count; i++)
        {
            const ref = wld.GetFragmentByIndex(buffer.readInt32LE());

            if (ref)
                this.refs.push(ref);
        }

        return this;
    }
}
