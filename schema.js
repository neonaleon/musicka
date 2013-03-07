var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:musicka@localhost:5432/musicka-local' 
//'postgres://btqkctxdnitkrq:vZWExA6HeLbxst7MHzLGf9nBVA@ec2-54-243-242-213.compute-1.amazonaws.com/d35bo6oug912uf';
var client, query;
client = new pg.Client(connectionString);
client.connect();

//query = client.query("CREATE TABLE user_playlist (id bigint, song varchar(11), rating numeric, PRIMARY KEY(id, song))");
query = client.query("CREATE TABLE user_token (id bigint PRIMARY KEY, token varchar(255))");
query = client.query("SELECT token FROM user_token WHERE id = ''");
query = client.query("INSERT INTO user_token(id, token) values('', '')");
query = client.query("UPDATE user_token SET token = '' WHERE id = ''");
//client.query("INSERT INTO user_playlist(id, song) values('', '')");
//query = client.query("SELECT song, rating FROM user_playlist WHERE id = ''");
//query = client.query("DELETE FROM user_playlist WHERE id = '' AND song = ''");
//query = client.query("UPDATE user_playlist SET rating = '' WHERE id = '' AND song = ''");

query.on('end', function() {
	client.end();
});