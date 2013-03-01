var pg = require('pg').native;
var connectionString = process.env.DATABASE_URL || 'postgres://btqkctxdnitkrq:vZWExA6HeLbxst7MHzLGf9nBVA@ec2-54-243-242-213.compute-1.amazonaws.com/d35bo6oug912uf';
var client, query;
client = new pg.Client(connectionString);
client.connect();

query = client.query('CREATE TABLE user_playlist (id varchar(16), song varchar(11), rating numeric, PRIMARY KEY(id, song))');
//client.query("INSERT INTO user_playlist(id, song) values('', '', 0)");
//query = client.query("SELECT song, rating FROM user_playlist WHERE id = ''");
//query = client.query("DELETE FROM user_playlist WHERE id = '' AND song = ''");

query.on('end', function() {
	client.end();
});