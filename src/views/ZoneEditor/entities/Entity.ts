export abstract class Entity
{
    public id: number;
    public type: string;
    public mesh_id: number | null;

    constructor(id: number, type: string)
    {
        this.id = id;
        this.type = type;
        this.mesh_id = null;
    }
}
