=== rawdebug ===
Contributors: tolstoydotcom
Donate link: https://example.com/
Tags: devel, debug, development, programming, logging, stacktrace, backtrace, errors, warnings
Requires at least: 1
Tested up to: 6.2
Stable tag: 1.0.2
Requires PHP: 7.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

This is just three functions that you can use to debug problems with Wordpress.


== Description ==

These functions show information about variables, provide a backtrace, and log to a file.
This is not a plugin per se; Wordpress does not have to be running to use these functions.

NOTE: These functions are only intended to be used on dev sites.
Do not use on public facing sites as they might expose confidential information.

After installation (see below), three functions are available. You can put these into
contributed plugins, core code, etc.:

* summerize($val) returns a text or array summary of $val.

* dbt($limit = 11, $withArgs = FALSE) returns a backtrace as an array.
The first argument controls how many levels it shows and the last controls
whether the backtrace includes arguments.

* rawdebug(...$args) logs zero or more arguments to a file. Each argument
is run through summerize().

For example:
  $comment = get_comment(1);
  rawdebug('comment', $comment, dbt());

By default, rawdebug() logs to a file named `log.log` in the `wp-content/uploads` directory:
The function will try to create that file if it doesn't exist.
If it can't do that or can't write to it, it will show a warning: see below.

If all goes well, the directories should look like this:

  wp-content
    uploads
      log.log

On Linux or Mac, you can see realtime updates to `log.log` by opening a
terminal in the same directory and running the following:
`tail -f log.log`


== Installation ==
1. Do a full backup of your files and database.
This is very important, do not skip this step.

2. Locate the directory that contains your wp-config.php file.
This is probably the root of your installation.

3. Copy the rawdebug.php file (it's in the same directory as this file)
into the directory that has your wp-config.php file.
For instance, it might be like this:
  sites
    default
      wp-config.php
      rawdebug.php

4. Make sure wp-config.php is writable by you.
How you do that depends on your platform.
On Windows you might need to right-click the file.
On Linux or Mac do this:
  `ls -l wp-config.php`
  `chmod 777 wp-config.php`

5. Near the end of wp-config.php, add the following line:
  require_once(__DIR__ . '/rawdebug.php');

So, the end of that file should end up looking something like this:
  if ( ! defined( 'ABSPATH' ) ) {
	  define( 'ABSPATH', __DIR__ . '/' );
  }

  require_once( __DIR__ . '/rawdebug.php' );

  /** Sets up WordPress vars and included files. */
  require_once ABSPATH . 'wp-settings.php';


6. Set wp-config.php back to readonly.
On Windows, undo what you did when you right-clicked the file.
On Linux or Mac restore the permissions to what they were before.

7. Reload the site. If you get a message starting with 'rawdebug warning',
see below. If you get a WSOD, review the steps above.

If it still doesn't work, make wp-config.php writable, remove the line you
added in #5, and then make wp-config.php readonly.


== Frequently Asked Questions ==

= I see "rawdebug warning: file cannot be created" =

Make sure you have a `wp-content` directory next to wp-config.php and that there's a `uploads` directory inside that, if not create them.
In the `uploads` directory, create a file named `log.log`.
Change the file to be writable by everyone. On Windows, you probably right-click the file.
On Linux or Mac, run `chmod 777 log.log`.
(Note again: do not install this on a publicly-available site.)


= I see "rawdebug warning: file is not writeable" =

This means `log.log` can be found, but it's not writable. Follow the last
instructions above.


= I see "Call to undefined function..." =

If what comes after that is phpdebug, dbt, or summerize, that means the
installation hasn't been done or isn't working. Review the steps above.

== Changelog ==

= 1.0 =
* Initial version.
