import StandardQueryList from './StandardQueryList';
import DatabaseConnection from './Database';
import { ISpawnData } from '../views/ZoneEditor/entity/Entity';

export default class Spawn2QueryList extends StandardQueryList
{
    constructor(db: DatabaseConnection)
    {
        super(db, 'spawn2');
    }

    async ZoneEditorSave(spawn: ISpawnData)
    {
        const spawngroup = spawn.spawngroup;
        
        const new_spawn = { ...spawn, spawngroupID: spawngroup.id }
        delete new_spawn.spawngroup;

        console.log(new_spawn)
        console.log(spawngroup)
    }
}
