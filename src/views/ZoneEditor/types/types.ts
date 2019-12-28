import * as BABYLON from 'babylonjs';

export interface IZoneListEntry
{
    id:         number;
    short_name: string | null;
    long_name:  string;
    expansion:  string;
}

export interface IZoneGeometry
{
    bounding_info: BABYLON.BoundingInfo;
    center:        BABYLON.Vector3;
    max:           BABYLON.Vector3;
    min:           BABYLON.Vector3;
    volume:        number;
}