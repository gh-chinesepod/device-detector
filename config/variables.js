
var ENV = process.env.ENVIRONMENT || 'prod';

module.exports = { 
    mongoURL158      : process.env.MongoURI158,
    mongoOptions    : { 
                        useNewUrlParser: true, 
                        useUnifiedTopology: true 
                      },
    mongoDB         : 'bigfoot',
    
};
