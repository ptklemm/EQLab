import { SmartBuffer } from 'smart-buffer';
import _ from 'lodash';
import { PFSFile } from './PFS';
import * as Fragments from './fragments';

class WLDHeader
{
    public signature:   number;
    public version:     number;
    public frag_count:  number;
    public bsp_count:   number;
    public header4:     number;
    public string_size: number;
    public header6:     number;

    constructor(buffer: Buffer)
    {
        this.signature   = buffer.readInt32LE(0);
        this.version     = buffer.readInt32LE(4);
        this.frag_count  = buffer.readInt32LE(8);
        this.bsp_count   = buffer.readInt32LE(12);
        this.header4     = buffer.readInt32LE(16);
        this.string_size = buffer.readInt32LE(20);
        this.header6     = buffer.readInt32LE(24);
    }
}

class WLDFile
{
    static SIGNATURE = 0x54503D02;
    static VERSION_1 = 0x00015500;
    static VERSION_2 = 0x1000C800;
    static STR_HASH  = [0x95, 0x3A, 0xC5, 0x2A, 0x95, 0x7A, 0x95, 0x6A];

    public name:        string | null;
    public options:     any;
    public buffer:      Buffer;
    public size:        number;
    public header:      WLDHeader | null;
    public string:      string;
    public frag_offset: number | null;
    public fragments:   Fragments.BaseFragment[];

    constructor(file: PFSFile)
    {
        this.name        = file.name;
        this.options     = {};
        this.buffer      = file.buffer;
        this.size        = file.buffer.length;
        this.header      = null;
        this.string      = "";
        this.frag_offset = null;
        this.fragments   = [];
    }

    public Load(): WLDFile
    {
        const buffer = SmartBuffer.fromBuffer(this.buffer);

        this.header = new WLDHeader(buffer.readBuffer(28));

        if (this.header.signature !== WLDFile.SIGNATURE)
            throw new Error(`${this.name} is not a valid WLD file: Invalid signature.`);
        
        if (!(this.header.version === WLDFile.VERSION_1 || this.header.version === WLDFile.VERSION_2))
            throw new Error(`${this.name} is not a valid WLD file: Invalid version.`);

        this.string = WLDFile.DecodeString(buffer.readBuffer(this.header.string_size));

        this.frag_offset = buffer.readOffset;

        for (let i = 1; i < this.header.frag_count + 1; i++)
        {
            const fragment = this.CreateFragment(buffer, {
                index: i,
                offset: buffer.readOffset,
                size: buffer.readInt32LE(),
                type: buffer.readInt32LE()
            });

            this.fragments.push(fragment);
        }

        delete this.buffer;
        buffer.destroy();

        return this;
    }

    public GetFragmentsByType(type: number): Fragments.BaseFragment[]
    {
        return _.filter(this.fragments, { type });
    }

    public GetFragmentByIndex(index: number): Fragments.BaseFragment | null
    {
        if (index === 0)
            index = 1;
        
        if (this.fragments[index-1])
        {
            return this.fragments[index-1];
        }
        else
        {
            return null;
        }
    }

    public GetStringByIndex(index: number): string
    {
        let str = "";

        for (let i = index; i < this.string.length; i++)
        {
            if (this.string[i] === "\0")
                break;
            
            str += this.string[i];
        }

        return str;
    }

    public GetFragmentReference(index: number): Fragments.BaseFragment | string | null
    {
        if (index < 0)
        {
            index *= -1;
            return this.GetStringByIndex(index);
        }
        else
        {
            return this.GetFragmentByIndex(index);
        }
    }

    private CreateFragment(buffer: SmartBuffer, header: Fragments.FragmentHeader): Fragments.BaseFragment
    {
        let fragment: Fragments.BaseFragment;

        switch(header.type)
        {
            case 0x03: {
                fragment = new Fragments.F03(header).Load(buffer, this);
                break;
            } 
            case 0x04: {
                fragment = new Fragments.F04(header).Load(buffer, this);
                break;
            } 
            case 0x05: {
                fragment = new Fragments.F05(header).Load(buffer, this);
                break;
            } 
            case 0x06: {
                // Two-dimensional Object
                fragment = new Fragments.F06(header).Skip(buffer);
                break;
            } 
            case 0x07: {
                // Two-dimensional Object Reference
                fragment = new Fragments.F07(header).Skip(buffer);
                break;
            } 
            case 0x08: {
                fragment = new Fragments.F08(header).Load(buffer, this);
                break;
            } 
            case 0x09: {
                fragment = new Fragments.F09(header).Load(buffer, this);
                break;
            } 
            case 0x10: {
                fragment = new Fragments.F10(header).Load(buffer, this);
                break;
            } 
            case 0x11: {
                fragment = new Fragments.F11(header).Load(buffer, this);
                break;
            } 
            case 0x12: {
                fragment = new Fragments.F12(header).Load(buffer, this);
                break;
            } 
            case 0x13: {
                fragment = new Fragments.F13(header).Load(buffer, this);
                break;
            } 
            case 0x14: {
                fragment = new Fragments.F14(header).Load(buffer, this);
                break;
            } 
            case 0x15: {
                fragment = new Fragments.F15(header).Load(buffer, this);
                break;
            } 
            case 0x16: {
                fragment = new Fragments.F16(header).Load(buffer, this);
                break;
            } 
            case 0x17: {
                fragment = new Fragments.F17(header).Load(buffer, this);
                break;
            } 
            case 0x18: {
                fragment = new Fragments.F18(header).Load(buffer, this);
                break;
            } 
            case 0x1B: {
                fragment = new Fragments.F1B(header).Load(buffer, this);
                break;
            } 
            case 0x1C: {
                fragment = new Fragments.F1C(header).Load(buffer, this);
                break;
            } 
            case 0x21: {
                // BSP Tree
                fragment = new Fragments.F21(header).Skip(buffer);
                break;
            } 
            case 0x22: {
                // BSP Region
                fragment = new Fragments.F22(header).Skip(buffer);
                break;
            } 
            case 0x26: {
                fragment = new Fragments.F26(header).Load(buffer, this);
                break;
            } 
            case 0x28: {
                fragment = new Fragments.F28(header).Load(buffer, this);
                break;
            } 
            case 0x29: {
                fragment = new Fragments.F29(header).Load(buffer, this);
                break;
            } 
            case 0x2A: {
                fragment = new Fragments.F2A(header).Load(buffer, this);
                break;
            } 
            case 0x2C: {
                // Alternate Mesh
                fragment = new Fragments.F2C(header).Skip(buffer);
                break;
            } 
            case 0x2D: {
                fragment = new Fragments.F2D(header).Load(buffer, this);
                break;
            } 
            case 0x2F: {
                // Mesh Animated Vertices Reference
                fragment = new Fragments.F2F(header).Skip(buffer);
                break;
            } 
            case 0x30: {
                fragment = new Fragments.F30(header).Load(buffer, this);
                break;
            } 
            case 0x31: {
                fragment = new Fragments.F31(header).Load(buffer, this);
                break;
            } 
            case 0x32: {
                fragment = new Fragments.F32(header).Load(buffer, this);
                break;
            } 
            case 0x33: {
                fragment = new Fragments.F33(header).Load(buffer, this);
                break;
            } 
            case 0x34: {
                // Unknown34 (Particle Info?)
                fragment = new Fragments.F34(header).Skip(buffer);
                break;
            } 
            case 0x35: {
                fragment = new Fragments.F35(header).Load(buffer, this);
                break;
            }
            case 0x36: {
                fragment = new Fragments.F36(header).Load(buffer, this);
                break;
            } 
            case 0x37: {
                // Mesh Animated Vertices
                fragment = new Fragments.F37(header).Skip(buffer);
                break;
            } 
            default:
                throw new Error(`${this.name}: Error creating fragment. Invalid type at byte ${header.offset}`);
        }

        return fragment;
    }

    static DecodeString(buffer: Buffer): string
    {
        let string = Buffer.alloc(buffer.length);

        for (let i = 0; i < string.length; i++)
        {
            string[i] = buffer[i] ^ WLDFile.STR_HASH[i % WLDFile.STR_HASH.length];
        }

        return string.toString('ascii');
    }
}

export default WLDFile
