const MongoClient = require( 'mongodb' ).MongoClient;
const mongoose = require('mongoose');
const _variables = require( './variables' );

var _db;

module.exports = {

  connectToServer: function( callback ) {
    MongoClient.connect( _variables.mongoURL158 ,  _variables.mongoOptions, function( err, client ) {
      _db  = client.db('bigfoot');
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  },

  


};