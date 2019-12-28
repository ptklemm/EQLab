import * as BABYLON from 'babylonjs';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { EQEntity } from './Entity';

momentDurationFormatSetup(moment);

export class EQPosition
{
    public x: number;
    public y: number;
    public z: number;

    constructor(x: number, y: number, z: number)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public toVector3(): BABYLON.Vector3
    {
        return EQPosition.ToVector3(this.x, this.y, this.z);
    }

    public format(entity_type: string): EQPosition
    {
        switch (entity_type)
        {
            case EQEntity.TYPE_SPAWN:
                this.x = Number(Number(this.x.toPrecision(14)).toFixed(6));
                this.y = Number(Number(this.y.toPrecision(14)).toFixed(6));
                this.z = Number(Number(this.z.toPrecision(14)).toFixed(6));
                break;
            case EQEntity.TYPE_BLOCKEDSPELL:
            case EQEntity.TYPE_GROUNDSPAWN:
            case EQEntity.TYPE_SAFEPOINT:
            case EQEntity.TYPE_STARTZONE:
            case EQEntity.TYPE_TRAP:
            case EQEntity.TYPE_UNDERWORLD:
            case EQEntity.TYPE_ZONEPOINT:
                this.x = Math.trunc(Number(this.x.toPrecision(11)));
                this.y = Math.trunc(Number(this.y.toPrecision(11)));
                this.z = Math.trunc(Number(this.z.toPrecision(11)));
                break;
            case EQEntity.TYPE_DOOR:
            case EQEntity.TYPE_GRIDENTRY:
                this.x = Number(Number(this.x.toPrecision(14)).toFixed(4));
                this.y = Number(Number(this.y.toPrecision(14)).toFixed(4));
                this.z = Number(Number(this.z.toPrecision(14)).toFixed(4));
                break;
            default:
                break;
        }

        return this;
    }

    public static ToVector3(x: number, y: number, z: number): BABYLON.Vector3
    {
        return new BABYLON.Vector3(y, z, x);
    }

    public static FromVector3(vector: BABYLON.Vector3): EQPosition
    {
        return new EQPosition(vector.z, vector.x, vector.y);
    }
}

export class EQHeading
{
    public heading: number;
    public incline: number;

    constructor(heading: number, incline?: number)
    {
        this.heading = heading;
        this.incline = incline || 0;
    }

    public toQuaternion(): BABYLON.Quaternion
    {
        return EQHeading.ToQuaternion(this.heading);
    }

    public format(entity_type: string): EQHeading
    {
        switch (entity_type)
        {
            case EQEntity.TYPE_SPAWN:
                this.heading = Number(Number(this.heading.toPrecision(14)).toFixed(6));
                break;
            case EQEntity.TYPE_GROUNDSPAWN:
            case EQEntity.TYPE_STARTZONE:
            case EQEntity.TYPE_ZONEPOINT:
                this.heading = Math.trunc(Number(this.heading.toPrecision(11)));
                break;
            case EQEntity.TYPE_DOOR:
                this.heading = Number(Number(this.heading.toPrecision(14)).toFixed(4));
                this.incline = Number(Number(this.incline.toPrecision(14)).toFixed(4));
                break;
            case EQEntity.TYPE_GRIDENTRY:
                this.heading = Number(Number(this.heading.toPrecision(14)).toFixed(4));
                break;
            default:
                break;
        }

        return this;
    }

    public static ToQuaternion(heading: number): BABYLON.Quaternion
    {
        return BABYLON.Quaternion.RotationYawPitchRoll(
            BABYLON.Angle.FromDegrees((((heading - 128) * -1) / 512) * 360).radians(),
            0,
            0
        );
    }

    public static FromQuaternion(quaternion: BABYLON.Quaternion | null): EQHeading
    {
        if (!quaternion)
            return new EQHeading(0);

        const rotation = quaternion.toEulerAngles();
        let heading = Number(BABYLON.Angle.FromRadians(rotation.y).degrees().toPrecision(10)) * (512 / 360);

        if (heading % 1 === 0)
            heading = Math.trunc(heading);

        heading = (heading * -1) + 128;
        
        // Keep headings between 0 and 512
        if (heading < 0)
            heading += 512;

        if (heading > 512)
            heading -= 512;

        return new EQHeading(heading);
    }
    
    public static HeadingAndInclineToQuaternion(heading: number, incline: number): BABYLON.Quaternion
    {
        return BABYLON.Quaternion.RotationYawPitchRoll(
            BABYLON.Angle.FromDegrees((heading / 512) * 360).radians(),
            BABYLON.Angle.FromDegrees(incline).radians(),
            0
        );
    }

    public static QuaternionToHeadingAndIncline(quaternion: BABYLON.Quaternion): EQHeading
    {
        const rotation = quaternion.toEulerAngles();

        let heading = Number(BABYLON.Angle.FromRadians(rotation.y).degrees().toPrecision(10)) * (512 / 360);
        if (heading % 1 === 0) { heading = Math.trunc(heading); }
    
        let incline = Number(BABYLON.Angle.FromRadians(rotation.x).degrees().toPrecision(10));
        if (incline % 1 === 0) { incline = Math.trunc(incline); }
    
        return new EQHeading(heading, incline);
    }
}

export function FormatRespawnTime(respawn_time: number, variance?: number): string
{
    let respawn: string = '';
    let plus_minus: string = '';

    //@ts-ignore
    respawn = moment.duration(respawn_time, 'seconds').format('h:mm:ss');

    if (variance)
    {
        //@ts-ignore
        plus_minus = moment.duration(variance, 'seconds').format('h:mm:ss');
        respawn = respawn + ' \xB1 ' + plus_minus;
    }

    return respawn;
}
