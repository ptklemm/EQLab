import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

interface LightFlags
{
    bit0:           boolean;
    is_point_light: boolean;
    bit2:           boolean;
    has_color:      boolean;
    has_color_2:    boolean;
}

interface LightColor
{
    a: number;
    r: number;
    g: number;
    b: number;
}

export class F1B extends BaseFragment
{
    public flags:       LightFlags;
    public params2:     number | null;
    public attenuation: number | null;
    public color:       LightColor | null;
    public alpha:       number | null;
    
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Light";

        this.flags = {
            bit0:           false,
            is_point_light: false,
            bit2:           false,
            has_color:      false,
            has_color_2:    false
        };
        this.params2      = null;
        this.attenuation  = null;
        this.color        = null;
        this.alpha        = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F1B
    {
        this.name = BaseFragment.GetName(buffer, wld);

        let flags = buffer.readInt32LE();
        this.flags.bit0           = flags & 1  ? true : false;
        this.flags.is_point_light = flags & 2  ? true : false;
        this.flags.bit2           = flags & 4  ? true : false;
        this.flags.has_color      = flags & 8  ? true : false;
        this.flags.has_color_2    = flags & 16 ? true : false;

        this.params2 = buffer.readInt32LE();

        if (this.flags.is_point_light)
            this.attenuation = buffer.readInt32LE();

        if (this.flags.has_color || this.flags.has_color_2)
        {
            this.color = {
                a: buffer.readFloatLE(),
                r: buffer.readFloatLE(),
                g: buffer.readFloatLE(),
                b: buffer.readFloatLE()
            }
        }
        else
        {
            this.alpha = buffer.readFloatLE();
        }
        
        return this;
    }
}