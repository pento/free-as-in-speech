URL=wxr.wplocal.xyz:1234

if [ ! -f "$1" ]; then
	echo "$1 doesn't exist."
	exit 1
fi

if [ ! -d wordpress ]; then
	rm -rf wordpress
	curl https://wordpress.org/latest.tar.gz | tar xz
	curl https://raw.githubusercontent.com/aaemnnosttv/wp-sqlite-db/master/src/db.php > wordpress/wp-content/db.php
	cp wordpress/wp-config{-sample,}.php
	svn co https://plugins.svn.wordpress.org/wordpress-importer/trunk/ wordpress/wp-content/plugins/wordpress-importer/
else
	rm -rf wordpress/wp-content/database
fi

wp core install --url=$URL --title=wxr --admin_user=admin --skip-email --admin_email=example@example.com --path=wordpress
wp option set permalink_structure "/%year%/%monthnum%/%day%/%postname%/" --path=wordpress
wp plugin activate wordpress-importer --path=wordpress
wp import "$1" --authors=create --path=wordpress
php -S $URL -t wordpress
