import fs from 'fs-extra';
import path from 'path';
import { SmartBuffer } from 'smart-buffer'
import zlib from 'zlib';

class PFSDirEntry
{
    public crc:           number;
    public offset:        number;
    public inflated_size: number;

    constructor(buffer: Buffer)
    {
        this.crc           = buffer.readInt32LE(0);
        this.offset        = buffer.readInt32LE(4);
        this.inflated_size = buffer.readInt32LE(8);
    }
}

export class PFSFile
{
    public name:   string;
    public buffer: Buffer;

    constructor(name: string, buffer: Buffer)
    {
        this.name   = name;
        this.buffer = buffer;
    }
}

export default class PFSArchive
{
    static SIGNATURE = 0x20534650;

    readonly filepath:   string;
    readonly name:       string;
    readonly pfs_type:   string;

    private size:        number | null;

    private dir_offset:  number | null;
    private signature:   number | null;
    private unknown:     number | null;

    private num_entries: number | null;
    private directory:   PFSDirEntry[];
    private filenames:   string[];
    private files:       PFSFile[];

    private steve:       string | null;
    private date:        number | null;

    constructor(filepath: string)
    {
        this.filepath    = filepath;
        this.name        = path.basename(filepath, path.extname(filepath));
        this.pfs_type    = this.DetermineType(this.name);
        this.size        = null;
        this.dir_offset  = null;
        this.signature   = null;
        this.unknown     = null;
        this.num_entries = null;
        this.directory   = [];
        this.filenames   = [];
        this.files       = [];
        this.steve       = null;
        this.date        = null;
    }

    public async Load(): Promise<PFSArchive>
    {
        const pfs = SmartBuffer.fromBuffer(await fs.readFile(this.filepath));
        this.size = pfs.length;

        // Header
        this.dir_offset = pfs.readInt32LE();
        this.signature = pfs.readInt32LE();

        if (this.signature !== PFSArchive.SIGNATURE)
            throw new Error(`${this.filepath} is not a valid PFS file.`);
        
        this.unknown = pfs.readInt32LE();

        // Directory
        pfs.readOffset = this.dir_offset;
        this.num_entries = pfs.readInt32LE();

        for (let i = 0; i < this.num_entries; i++)
        {
            const dir_entry = new PFSDirEntry(pfs.readBuffer(12));
            this.directory.push(dir_entry);
        }

        // Sort directory by ascending offset
        this.directory.sort((a, b) => a.offset - b.offset);

        // Footer
        if (this.size - pfs.readOffset >= 9)
        {
            this.steve = pfs.readString(5);
            this.date = pfs.readInt32LE();
        }

        // Load filenames from last dir entry
        const filenames_file = this.DecompressEntry(pfs, '', this.directory[this.directory.length - 1]);
        this.filenames = this.DecodeFilenames(filenames_file);

        // Decompress files
        for (let i = 0; i < this.directory.length - 1; i++)
        {
            const file = this.DecompressEntry(pfs, this.filenames[i], this.directory[i]);
            this.files.push(file);
        }

        pfs.destroy();
        return this;
    }

    public FileList(): string[]
    {
        return this.filenames;
    }

    public GetMainWLD(): PFSFile | any
    {
        if (this.pfs_type === 'Zone')
        {
            const zoneWLD = this.GetFile(this.name + '.wld');
            const objplaceWLD = this.GetFile('objects.wld');
            const lightsWLD = this.GetFile('lights.wld');

            return [zoneWLD, objplaceWLD, lightsWLD];
        }
        else
        {
            return this.GetFile(this.name + '.wld');
        }
    }

    public GetTextures(): PFSFile[]
    {
        let array: PFSFile[] = [];

        array = array.concat(this.GetFilesByExtension('.bmp'))
                     .concat(this.GetFilesByExtension('.dds'))
                     .concat(this.GetFilesByExtension('.jpg'));

        return array;
    }

    public GetFile(id: string | number): PFSFile | undefined
    {
        let index: number;
        if (typeof id === 'string')
        {
            // Get index from filename
            index = this.filenames.findIndex(val => val === id);
            if (index === -1) { return; }
        }
        else
        {
            if (id < 0 || id > this.directory.length - 1)
                return;
            index = id;
        }

        return this.files[index];
    }

    public GetFilesByExtension(ext: string): PFSFile[]
    {
        ext = ext.toLowerCase();

        const array: PFSFile[] = [];

        for (const file of this.files)
        {
            if (file.name.endsWith(ext))
            {
                array.push(file);
            }
        }

        return array;
    }

    private DecompressEntry(pfs: SmartBuffer, filename: string, dir_entry: PFSDirEntry): PFSFile
    {
        const decompressed: Buffer[] = [];

        pfs.readOffset = dir_entry.offset;

        let ilen = 0;
        while (ilen < dir_entry.inflated_size)
        {
            const block = {
                deflated_size: pfs.readInt32LE(),
                inflated_size: pfs.readInt32LE()
            }

            const compressed_block = pfs.readBuffer(block.deflated_size);
            const decompressed_block = zlib.inflateSync(compressed_block);

            decompressed.push(decompressed_block);

            ilen += block.inflated_size;
        }

        return new PFSFile(filename, Buffer.concat(decompressed));
    }

    private DecodeFilenames(file: PFSFile): string[]
    {
        const buffer = SmartBuffer.fromBuffer(file.buffer);
        const num_filenames = buffer.readUInt32LE();

        const filenames: string[] = [];
        for (let i = 0; i < num_filenames; i++)
        {
            const length = buffer.readInt32LE();
            const filename = buffer.readString(length-1);
            buffer.readOffset += 1;
            filenames.push(filename.toLowerCase());
        }

        return filenames;
    }

    private DetermineType(name: string): string
    {
        if (name.endsWith('_chr'))      { return 'Character'; }
        else if (name.endsWith('_obj')) { return 'Object';    }
        else                            { return 'Zone';      }
    }

}
