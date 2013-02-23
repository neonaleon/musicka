var pg = require('pg').native;
var connectionString = process.env.DATABASE_URL || 'postgres://btqkctxdnitkrq:vZWExA6HeLbxst7MHzLGf9nBVA@ec2-54-243-242-213.compute-1.amazonaws.com/d35bo6oug912uf';
var client, query;
client = new pg.Client(connectionString);
client.connect();

query = client.query('CREATE TABLE junk (name varchar(10), idk varchar(10))');
//client.query("INSERT INTO junk(name, idk) values('Ted', 'lolol')");*/
//query = client.query('SELECT * FROM junk');

query.on('end', function() {
	client.end();
});