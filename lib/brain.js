"use strict";

let DocumentClient = require('documentdb').DocumentClient;

const host = process.env.HUBOT_BRAIN_DOCUMENTDB_HOST;
const key = process.env.HUBOT_BRAIN_DOCUMENTDB_KEY;
const databaseName = process.env.HUBOT_BRAIN_DOCUMENTDB_DBNAME;
const collectionDefinition = process.env.HUBOT_BRAIN_DOCUMENTDB_COLLECTIONNAME;
const brainName = process.env.HUBOT_BRAIN_DOCUMENTDB_DOCUMENTNAME;

const DbUtils = require('./db-utils');
const client = new DocumentClient(host, {'masterKey':key});
const dbUtils = new DbUtils(client);

module.exports = function(robot){
    
    let lastSave = '';
    let dbDocument = {id:brainName, brain:{}};
    let initDbPromise = null;

    function setupDocDbClient(){

        if (initDbPromise) return initDbPromise;

        initDbPromise = dbUtils.getOrCreateDatabase(databaseName)
            .then(function(db){
                return dbUtils.getOrCreateCollection(db._self, collectionDefinition);
            })
            .then(function(coll){
                return dbUtils.getDocumentById(coll._self, brainName).then(doc => {
                    if (doc) return doc;

                    return dbUtils.createDocument(coll._self, dbDocument);
                });
            }).then(function(doc){
                var documentToMerge = doc.brain || {};

                lastSave = JSON.stringify(documentToMerge);
                
                robot.brain.mergeData(documentToMerge);

                return doc;
            });

        return initDbPromise;
    }

    function saveBrain(data){
        setupDocDbClient().then(doc => {
            let currentDump = JSON.stringify(data);

            if (currentDump === lastSave) return;

            lastSave = currentDump;

            dbDocument.brain = data;

            dbUtils.replaceDocument(doc._self, dbDocument);
        }).catch(reason => {
            robot.logger.debug('error', reason);
        });
    }

    robot.brain.on('save', function(data){
        saveBrain(data);
    });

    robot.brain.on('close', function(){
        saveBrain(robot.brain.data);
    });

};
