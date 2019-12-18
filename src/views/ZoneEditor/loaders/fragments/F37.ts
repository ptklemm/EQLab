import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F37 extends BaseFragment
{
    public flags:  number | null;
    public vertexCount:  number | null;
    public frameCount:  number | null;
    public param1:  number | null;
    public param2:  number | null;
    public scale:  number | null;
    public frameEntries:  [];
    public size6:  number | null;
    
    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Mesh Animated Vertices";

        this.flags = null;
        this.vertexCount = null;
        this.frameCount = null;
        this.param1 = null;
        this.param2 = null;
        this.scale = null;
        this.frameEntries = [];
        this.size6 = null;
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F37
    {
        this.name = BaseFragment.GetName(buffer, wld);
        return this;
    }
}
