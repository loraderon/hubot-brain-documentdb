
"use strict";

 class DbUtils {

    constructor(client){
        this.client = client;
    }

    getDatabase(dbId, cb){
        this.client.readDatabase(`dbs/${dbId}`, cb);
    }

    getOrCreateDatabase(dbId){

        return new Promise((resolve, reject) => {

            return this.getDatabase(dbId, (err, database) => {
                
                if (!err) return resolve(database);

                if (err && err.code !== 404) return reject(err);

                return this.client.createDatabase({id:dbId}, (err, database) => {
                    
                    if (err) return reject(err);

                    return resolve(database);
                });
            });
        });
    }

    getOrCreateCollection(dbLink, collId){
        return new Promise((resolve, reject) =>  {
            this.client.readCollections(dbLink).toArray((err, collections) => {

                var collection = collections.find(coll => coll.id === collId);

                if (collection) return resolve(collection);

                return this.client.createCollection(dbLink, {id:collId}, (err, collection) => {
                    if (err) reject(err);
                    return resolve(collection);
                });

            });
        });
    }

    deleteDatabase(dbId){
        return new Promise((resolve, reject) => {
            this.client.deleteDatabase(`dbs/${dbId}`, (err, db) => {
                if (!err) return resolve(db);
                return reject(err);
            });
        });
    }

    createDocument(collectionLink, doc){
        return new Promise((resolve, reject) => {
            this.client.createDocument(collectionLink, doc, (err, doc) => {
                if (err) return reject(err);
                return resolve(doc);
            });
        });
    }

    getDocumentById(collectionLink, docId){
        return new Promise((resolve, reject) => {
            let querySpec = {
                query: 'SELECT * FROM f WHERE  f.id = @id',
                parameters: [
                    {
                        name: '@id',
                        value: docId
                    }
                ]
            };
            this.client.queryDocuments(collectionLink, querySpec).toArray((err, result)=>{
                if (err) return reject(err);
                return resolve(result.shift());
            });
        });
    }

    replaceDocument(docLink, doc){
        return new Promise((resolve, reject) => {
            return this.client.replaceDocument(docLink, doc, (err, updated) => {
                if (err) return reject(err);
                return resolve(updated);
            });
        }); 
    }

}

module.exports = DbUtils;