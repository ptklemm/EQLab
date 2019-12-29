import path       from 'path';
import PFSArchive from './PFS';

interface ZoneArchiveList
{
    zone_PFS: PFSArchive;
    obj_PFS: PFSArchive;
    chr_PFS: PFSArchive;
}

export default class FileLoader
{
    static ZONE_S3D = '.s3d';
    static ZONE_OBJ_S3D = '_obj.s3d';
    static ZONE_CHR_S3D = '_chr.s3d';

    static ZONE_WLD = '.wld';
    static ZONE_OBJ_WLD = '_obj.wld';
    static ZONE_CHR_WLD = '_chr.wld';

    private eq_directory: string;

    constructor(eq_directory: string)
    {
        this.eq_directory = eq_directory;
    }

    public SetEQDirectory(path: string): void
    {
        this.eq_directory = path;
    }

    public async LoadZoneArchives(zone_short_name: string): Promise<ZoneArchiveList>
    {
        const [zone_PFS_path, obj_PFS_path, chr_PFS_path] = this.GetZonePFSList(zone_short_name);

        const zone_PFS = await new PFSArchive(zone_PFS_path).Load();
        const obj_PFS = await new PFSArchive(obj_PFS_path).Load();
        const chr_PFS = await new PFSArchive(chr_PFS_path).Load();

        return { zone_PFS, obj_PFS, chr_PFS };
    }

    private GetZonePFSList(zone_short_name: string): string[]
    {
        // ***To Do: Add extension check (s3d or eqg)

        // S3D Zone Files
        return [
            this.PFSPath(zone_short_name, FileLoader.ZONE_S3D),
            this.PFSPath(zone_short_name, FileLoader.ZONE_OBJ_S3D),
            this.PFSPath(zone_short_name, FileLoader.ZONE_CHR_S3D)
        ];
    }

    private PFSPath(zone_short_name: string, ext: string): string
    {
        return path.join(this.eq_directory, zone_short_name + ext);
    }
}
