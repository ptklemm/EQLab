import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F31 extends BaseFragment
{
    public flags:     number | null;
    public count:     number | null;
    public materials: BaseFragment[];

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "MultiMaterial";

        this.flags     = null;
        this.count     = null;
        this.materials = [];
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F31
    {
        this.name = BaseFragment.GetName(buffer, wld);

        this.flags = buffer.readInt32LE();
        this.count = buffer.readInt32LE();

        for (let i = 0; i < this.count; i++)
        {
            let index = buffer.readInt32LE();
            let ref = wld.GetFragmentByIndex(index);
            this.materials.push(ref as BaseFragment);
        }

        return this;
    }
}
