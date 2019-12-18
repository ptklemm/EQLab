import { FragmentHeader, BaseFragment, ReferenceFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

interface VisibilityFlags
{
    invisible:   boolean;
    masked:      boolean;
    particle:    boolean;
    transparent: boolean;
}

export class F30 extends ReferenceFragment
{
    public flags:      number | null;
    public visibility: VisibilityFlags;
    public params2:    number | null;
    public params3:    [number, number] | null;
    public params4:    [number, number] | null;

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Material";

        this.flags      = null;
        this.visibility = {
            invisible:   false,
            masked:      false,
            particle:    false,
            transparent: false
        };
        this.params2    = null;
        this.params3    = null;
        this.params4    = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F30
    {
        this.name = BaseFragment.GetName(buffer, wld);

        this.flags = buffer.readInt32LE();

        let vis = buffer.readInt32LE();

        if (vis === 0)
        { 
            this.visibility.invisible = true; 
        }
        else if (vis === -2147483629)
        {
            this.visibility.masked = true;
        }
        else if (vis === -2147483637 || vis === -2147483639 || vis === 1363 || vis === -2147483625)
        {
            this.visibility.particle = true;
        }
        else if (vis === -2147483643 || vis === -2147483638)
        {
            this.visibility.transparent = true;
        }
    
        this.params2 = buffer.readInt32LE();
        this.params3 = [buffer.readFloatLE(), buffer.readFloatLE()];

        this.ref = ReferenceFragment.GetReference(buffer, wld);

        if (this.flags & 2)
        {
            this.params4 = [buffer.readInt32LE(), buffer.readInt32LE()];
        }

        return this;
    }
}
