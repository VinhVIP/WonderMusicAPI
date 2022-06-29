CREATE TABLE account(
	id_account serial PRIMARY KEY,
	email varchar(50) UNIQUE,
	account_name varchar(50) UNIQUE,
	avatar text default '',
	password text NOT NULL,
	create_date date default CURRENT_DATE,
	role smallint default 0,
	account_status smallint default 0
);

insert into account(email, account_name, password) values ('vinhvipit@gmail.com', 'Quang Vinh', '123456');

CREATE TABLE album(
	id_album serial PRIMARY KEY,
	name_album varchar(50) UNIQUE,
	create_date date default CURRENT_DATE
);

CREATE TABLE song(
	id_song serial PRIMARY KEY,
	name_song varchar(50) UNIQUE,
	link text default '',
	lyrics text,
	description text,
	created timestamp without time zone default timezone('Asia/Ho_Chi_Minh'::text, now()),
	id_account serial NOT NULL,
	id_album serial,
	song_status smallint default 0,
	listen integer default 0,
	tag varchar(10) not null,

	FOREIGN KEY (id_account) REFERENCES account(id_account),
	FOREIGN KEY (id_album) REFERENCES album(id_album)
);

CREATE TABLE love(
	id_account serial,
	id_song serial,
	love_time timestamp without time zone default timezone('Asia/Ho_Chi_Minh'::text, now()),
	
	PRIMARY KEY(id_account, id_song),

	FOREIGN KEY (id_account) REFERENCES account(id_account),
	FOREIGN KEY (id_song) REFERENCES song(id_song)
);

CREATE TABLE singer_song(
	id_account serial,
	id_song serial,
	
	PRIMARY KEY(id_account, id_song),

	FOREIGN KEY (id_account) REFERENCES account(id_account),
	FOREIGN KEY (id_song) REFERENCES song(id_song)
);

CREATE TABLE comment(
	id_cmt serial PRIMARY KEY,
	id_account serial NOT NULL,
	id_song serial NOT NULL,
	content text NOT NULL,
	date_time timestamp without time zone default timezone('Asia/Ho_Chi_Minh'::text, now()) NOT NULL,
	id_cmt_parent integer default 0,

	FOREIGN KEY (id_account) REFERENCES account(id_account),
	FOREIGN KEY (id_song) REFERENCES song(id_song)
);

CREATE TABLE notification(
	id_notification serial PRIMARY KEY,
	content text NOT NULL,
	action text,
	notification_status smallint default 0,
	notification_time timestamp without time zone default timezone('Asia/Ho_Chi_Minh'::text, now())
);

CREATE TABLE type(
	id_type serial PRIMARY KEY,
	name_type varchar(50) UNIQUE,
	description text
);

CREATE TABLE song_type(
	id_song serial,
	id_type serial,

	PRIMARY KEY(id_song, id_type),

	FOREIGN KEY (id_song) REFERENCES song(id_song),
	FOREIGN KEY (id_type) REFERENCES type(id_type)
);

CREATE TABLE playlist(
	id_playlist serial PRIMARY KEY,
	name_playlist varchar(50) UNIQUE,
	id_account serial NOT NULL,
	playlist_status smallint default 0,

	FOREIGN KEY (id_account) REFERENCES account(id_account)
);

CREATE TABLE song_type(
	id_playlist serial,
	id_song serial NOT NULL,
	playlist_song_time timestamp without time zone default timezone('Asia/Ho_Chi_Minh'::text, now()),

	PRIMARY KEY(id_playlist, id_song),

	FOREIGN KEY (id_playlist) REFERENCES playlist(id_playlist),
	FOREIGN KEY (id_song) REFERENCES song(id_song) ON DELETE CASCADE
);

CREATE TABLE follow_account(
	id_follower serial,
	id_following serial,
	follow_time timestamp without time zone default timezone('Asia/Ho_Chi_Minh'::text, now()),

	PRIMARY KEY(id_follower, id_following),

	FOREIGN KEY (id_follower) REFERENCES account(id_account),
	FOREIGN KEY (id_following) REFERENCES account(id_account)
);

CREATE TABLE listen (
	id_song serial,
	day timestamp without time zone default date_trunc('day', timezone('Asia/Ho_Chi_Minh'::text, now()))::date,
	listenofday bigint default 1,
	
	PRIMARY KEY(id_song, day),
	FOREIGN KEY (id_song) REFERENCES song(id_song)
);
