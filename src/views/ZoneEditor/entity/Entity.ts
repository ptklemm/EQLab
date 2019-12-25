export abstract class Entity
{
    public type:    string;
    public id:      number;
    public label_id: number | null;
    public mesh_id: number | null;

    constructor(type: string, id: number, label_id: number | null, mesh_id: number | null = null)
    {
        this.type     = type;
        this.id       = id;
        this.label_id = label_id;
        this.mesh_id  = mesh_id;
    }
}

export class Spawn extends Entity
{
    public data: any;

    constructor(id: number, label_id: number, mesh_id: number, data: any)
    {
        super('Spawn', id, label_id, mesh_id);
        this.data = data;
    }
}

export class Door extends Entity
{
    public data: any;

    constructor(id: number, label_id: number, mesh_id: number, data: any)
    {
        super('Door', id, label_id, mesh_id);
        this.data = data;
    }
}
