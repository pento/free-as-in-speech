if [ "" == "$PORT" ]; then
	PORT=1234
fi
URL=127.0.0.1:$PORT
cd $(dirname $0)

if [ ! -f "$1" ]; then
	echo "$1 doesn't exist."
	exit 1
fi
echo '<?php define("DB_FILE","'$PORT'.sqlite");' > $PORT.php

if [ ! -d wordpress ]; then
	rm -rf wordpress
	curl https://wordpress.org/latest.tar.gz | tar xz
	curl https://raw.githubusercontent.com/aaemnnosttv/wp-sqlite-db/master/src/db.php > wordpress/wp-content/db.php
	cp wordpress/wp-config{-sample,}.php
	svn co https://plugins.svn.wordpress.org/wordpress-importer/trunk/ wordpress/wp-content/plugins/wordpress-importer/
else
	rm -f wordpress/wp-content/database/$PORT.sqlite
fi

WP="wp --require=$PORT.php"
$WP core install --url=$URL --title=wxr --admin_user=admin --admin_password=test --skip-email --admin_email=example@example.com --path=wordpress
$WP option set permalink_structure "/%year%/%monthnum%/%day%/%postname%/" --path=wordpress
$WP plugin activate wordpress-importer --path=wordpress
$WP import "$1" --authors=create --path=wordpress
php -dauto_prepend_file=`pwd`/$PORT.php -S $URL -t wordpress
