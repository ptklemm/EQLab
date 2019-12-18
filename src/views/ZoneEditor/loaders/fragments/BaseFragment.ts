import WLDFile from '../WLD';
import { SmartBuffer } from 'smart-buffer';

export interface FragmentHeader
{
    index:  number;
    offset: number;
    size:   number;
    type:   number;
}

export abstract class BaseFragment
{
    readonly index:  number;
    readonly offset: number;
    readonly size:   number;
    readonly type:   number;
    public desc:   string | null;
    public name:   string | null;

    constructor(header: FragmentHeader)
    {
        this.index  = header.index;
        this.offset = header.offset;
        this.size   = header.size;
        this.type   = header.type;
        this.desc   = null;
        this.name   = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): void {}

    public Skip(buffer: SmartBuffer): BaseFragment
    {
        buffer.readOffset += this.size;
        return this;
    }

    protected GoToEnd(buffer: SmartBuffer): void
    {
        buffer.readOffset = this.offset + 8 + this.size;
    }

    static GetName(buffer: SmartBuffer, wld: WLDFile): string | null
    {
        let val = buffer.readInt32LE();

        //Special case for first fragment
        if (val === -16777216)
        {
            val = 0;
        }

        if (val < 0)
        {
            return wld.GetStringByIndex(-1 * val);
        }
        else
        {
            return null;
        }
    }
}

export abstract class ReferenceFragment extends BaseFragment
{
    public ref: BaseFragment | string | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.ref = null;
    }

    static GetReference(buffer: SmartBuffer, wld: WLDFile): BaseFragment | string | null
    {
        const index = buffer.readInt32LE();
        return wld.GetFragmentReference(index);
    }
}
