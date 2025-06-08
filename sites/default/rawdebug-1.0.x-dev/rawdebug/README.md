# rawdebug

## Table of contents

- Summary
- Requirements
- Installation
- Usage
- Privacy
- rawdebug warning: file cannot be created
- rawdebug warning: file is not writeable
- Call to undefined function...
- Skipping log.log
- Current Maintainers


## Summary

rawdebug isn't a module, it's just three functions
that you can use to debug problems with Drupal or Wordpress.

See readme.txt for the Wordpress instructions.

## Requirements

These functions have no dependencies.
The functions should be available anywhere in the site at any time.

NOTE: These functions are only intended to be used on dev sites.
Do not use on public facing sites as they might expose confidential information.


## Installation

You can enable this module to get a basic help page, but that's not necessary.

In order to use the functions follow these steps:

1. Do a full backup of your files and database.
This is very important, do not skip this step.

2. Locate the directory that contains your settings.php file.
This is probably `web/sites/default` or `sites/default`.
If you're using multisite and have multiple settings.
php files, you'll need to follow the directions for each of those.

3. Copy the rawdebug.php file (it's in the same directory as this file)
into the directory that has your settings.php file.
For instance, it might be like this:
  sites
    default
      settings.php
      rawdebug.php

4. Make sure settings.php is writable by you.
How you do that depends on your platform.
On Windows you might need to right-click the file.
On Linux or Mac do this:
  `ls -l settings.php`
  `chmod 777 settings.php`

5. At the end of settings.php, add the following line:
  require_once(__DIR__ . '/rawdebug.php');

6. Set settings.php back to readonly.
On Windows, undo what you did when you right-clicked the file.
On Linux or Mac restore the permissions to what they were before.

7. Reload the site. If you get a message starting with 'rawdebug warning',
see below. If you get a WSOD, review the steps above.

If it still doesn't work, make settings.php writable, remove the line you
added in #5, and then make settings.php readonly.


## Usage

After doing the above, three functions are available. You can put these into
contributed modules, core code, etc.:

* summerize($val) returns a text or array summary of $val.

* dbt($limit = 11, $withArgs = FALSE) returns a backtrace as an array.
The first argument controls how many levels it shows and the last controls
whether the backtrace includes arguments.

* rawdebug(...$args) logs zero or more arguments to a file. Each argument
is run through summerize().

For example:
  $val = $config->get('safe_tokens');
  rawdebug('safe_tokens', $val, dbt());

By default, rawdebug() logs to a file named `log.log` in the `files` directory:
The function will try to create that file if it doesn't exist.
If it can't do that or can't write to it, it will show a warning: see below.

If all goes well, the directories should look like this:

  sites
    default
      settings.php
      rawdebug.php
      files
        log.log

On Linux or Mac, you can see realtime updates to `log.log` by opening a
terminal in the same directory and running the following:
`tail -f log.log`


## Privacy

If you're using this module to help others debug an issue, make sure to open
`log.log` in a text editor and delete its contents.
Then, run the code that causes the problem.
Before posting `log.log`, review it for any privileged information like passwords.


## rawdebug warning: file cannot be created

Make sure you have a `files` directory next to settings.php, if not create it.
In that directory, create a file named `log.log`.
Change the file to be writable by everyone. On Windows, you probably right-click the file.
On Linux or Mac, run `chmod 777 log.log`.
(Note again: do not install this on a publicly-available site.)


## rawdebug warning: file is not writeable

This means `log.log` can be found, but it's not writable. Follow the last
instructions above.


## Call to undefined function...

If what comes after that is phpdebug, dbt, or summerize, that means the
installation hasn't been done or isn't working. Review the steps above.


## Skipping log.log

If for some reason creating a writable `log.log` file isn't possible, edit
rawdebug.php (the one next to settings.php).

Change this:
`$GLOBALS['rawdebug_use_error_log_as_backup'] = FALSE;`

to this:
`$GLOBALS['rawdebug_use_error_log_as_backup'] = TRUE;`

That will bypass using log.log and write to your web server's error log file instead.
You'll need to consult the documentation for your web server to find it, but on
Linux systems it might be something like one of these:
`/var/log/apache2/error.log`
`/var/log/apache2/yoursite.com/error.log`


## Current Maintainers

- Chris Kelly - <https://www.drupal.org/u/tolstoydotcom>
