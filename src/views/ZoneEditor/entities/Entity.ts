import { Mesh } from 'babylonjs';

export abstract class Entity
{
    public id: number;
    public type: string;
    public mesh: Mesh | null;

    constructor(id: number, type: string)
    {
        this.id = id;
        this.type = type;
        this.mesh = null;
    }
}
