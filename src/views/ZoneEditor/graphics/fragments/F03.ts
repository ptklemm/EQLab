import { FragmentHeader, BaseFragment } from './BaseFragment';
import { SmartBuffer } from 'smart-buffer';
import WLDFile from '../WLD';

export class F03 extends BaseFragment
{
    public count:        number | null;
    public name_lengths: number[];
    public entries:      string[];

    constructor(header: FragmentHeader)
    {
        super(header);
        this.desc = "Texture Bitmap(s)";

        this.count        = null;
        this.name_lengths = [];
        this.entries      = [];
    }

    public Load(buffer: SmartBuffer, wld: WLDFile): F03
    {
        this.name = BaseFragment.GetName(buffer, wld);

        this.count = buffer.readInt32LE();
        if (this.count === 0)
            this.count = 1;
        
        for (let i = 0; i < this.count; i++)
        {
            const name_length = buffer.readInt16LE();
            this.name_lengths.push(name_length);

            let name: Buffer | string = buffer.readBuffer(name_length);
            name = WLDFile.DecodeString(name).replace(/\0.*$/g, '');

            // Luclin Zones+ use 8-bit texture maps to apply texture, need to find flag that defines this, 
            // check for comma and cut off the RGB values for now
            if (name.includes(','))
            {
                name = name.substr(name.lastIndexOf(' ') + 1);
            }

            this.entries.push(name);
        }

        this.GoToEnd(buffer);

        return this;
    }
}
