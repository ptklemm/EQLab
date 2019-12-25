import * as BABYLON from 'babylonjs';

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


    public static ToVector3(x: number, y: number, z: number): BABYLON.Vector3
    {
        return new BABYLON.Vector3(y, z, x);
    }

    public static FromVector3(vector: BABYLON.Vector3): EQPosition
    {
        let x = Number(vector.z.toPrecision(10));
        let y = Number(vector.x.toPrecision(10));
        let z = Number(vector.y.toPrecision(10));
    
        if (x % 1 === 0) { x = Math.trunc(x); }
        if (y % 1 === 0) { y = Math.trunc(y); }
        if (z % 1 === 0) { z = Math.trunc(z); }

        return new EQPosition(x, y, z);
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

    public static ToQuaternion(heading: number): BABYLON.Quaternion
    {
        return BABYLON.Quaternion.RotationYawPitchRoll(BABYLON.Angle.FromDegrees(((-heading / 256) * 360) + 90).radians(), 0, 0);
    }

    public static FromQuaternion(quaternion: BABYLON.Quaternion): EQHeading
    {
        const rotation = quaternion.toEulerAngles();
        let heading = Number(BABYLON.Angle.FromRadians(rotation.y).degrees().toPrecision(10));
        heading = (((heading - 90) * 256) / 360) * -1;
        if (heading % 1 === 0) { heading = Math.trunc(heading); }
        return new EQHeading(heading);
    }
    
    public static HeadingAndInclineToQuaternion(heading: number, incline: number): BABYLON.Quaternion
    {
        return BABYLON.Quaternion.RotationYawPitchRoll(
            BABYLON.Angle.FromDegrees(heading).radians(),
            BABYLON.Angle.FromDegrees(incline).radians(),
            0
        );
    }

    public static QuaternionToHeadingAndIncline(quaternion: BABYLON.Quaternion): EQHeading
    {
        const rotation = quaternion.toEulerAngles();

        let heading = Number(BABYLON.Angle.FromRadians(rotation.y).degrees().toPrecision(10));
        if (heading % 1 === 0) { heading = Math.trunc(heading); }
    
        let incline = Number(BABYLON.Angle.FromRadians(rotation.x).degrees().toPrecision(10));
        if (incline % 1 === 0) { incline = Math.trunc(incline); }
    
        return new EQHeading(heading, incline);
    }
}
