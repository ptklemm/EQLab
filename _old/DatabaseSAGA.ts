import mysql   from 'mysql';
import Treeize from 'treeize';

export const StandardQueryList = (table_name: string) =>
({
    Select: (id: number) => db.execFirst(`Select * FROM ${table_name} WHERE id = ${id}`)
});

interface DatabaseConnection
{
    _config:     mysql.ConnectionConfig | null;
    _connection: mysql.Connection | null;
    Connect:     (config: mysql.ConnectionConfig) => Promise<void>;
    Close:       () => Promise<void>;
    execFirst:   (querystr: string) => Promise<any>;
    execAll:     (querystr: string) => Promise<any[]>;
    execTree:    (querystr: string) => Promise<any>;
}

export const db: DatabaseConnection = {
    _config:     null,
    _connection: null,

    Connect: (config: mysql.ConnectionConfig) => {
        return new Promise((resolve, reject) => {
            db._config = config;

            db._connection = mysql.createConnection(config);

            
            db._connection.connect((error) => {
                if (error)
                    reject(error);
    
                if (db._connection)
                    console.log(`Database connected as ID ${db._connection.threadId}`);

                resolve();
            });
        });
    },

    Close: () => {
        return new Promise((resolve, reject) => {
            if (db._connection)
            {
                db._connection.end((error) => {
                    if (error)
                        reject(error)

                    resolve();
                });
            }
        });
    },

    execFirst: (querystr) => {
        return new Promise((resolve, reject) => {
            if (db._connection)
            {
                db._connection.query(querystr, (error, results) => {
                    if (error)
                        reject(error);
    
                    resolve(results[0]);
                });
            }
            else
            {
                reject('No database connection.');
            }
        });
    },

    execAll: (querystr) => {
        return new Promise((resolve, reject) => {
            if (db._connection)
            {
                db._connection.query(querystr, (error, results) => {
                    if (error)
                        reject(error);
    
                    resolve(results);
                });
            }
            else
            {
                reject('No database connection.');
            }
        });
    },

    execTree: (querystr) => {
        return new Promise((resolve, reject) => {
            if (db._connection)
            {
                db._connection.query(querystr, (error, results) => {
                    if (error)
                        reject(error);
    
                    const tree = new Treeize().grow(results).getData();

                    resolve(tree);
                });
            }
            else
            {
                reject('No database connection.');
            }
        });
    }
}
