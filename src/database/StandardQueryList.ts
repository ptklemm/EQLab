import DatabaseConnection from './Database';

export default class StandardQueryList
{
    protected _db: DatabaseConnection;
    private table: string;

    constructor(db: DatabaseConnection, table: string)
    {
        this._db = db;
        this.table = table;
    }

    async Select(id: string | number): Promise<any>
    {
        return await this._db.queryFirst(`SELECT * FROM ${this.table} WHERE id = ?`, id);
    }

    async Insert(data: any): Promise<any>
    {
        const res = await this._db.queryAll(`INSERT INTO ${this.table} SET ?`, data);
        return await this.Select(res.insertId);
    }

    async Update(data: any, id?: string | number): Promise<any>
    {
        const res = await this._db.queryAll(`UPDATE ${this.table} SET ? WHERE id = ?`, [data, id || data.id]);
        return await this.Select(data.id);
    }

    async Delete(id: string | number): Promise<number>
    {
        const res = await this._db.queryAll(`DELETE FROM ${this.table} WHERE id = ?`, id);
        return res.affectedRows;
    }
}
