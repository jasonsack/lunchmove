# Lunchmove

### Setting up the environment

Make sure you have Virtualenv installed on your local machine.

Create the virtualenv:

    $ virtualenv lunchmove-env

Set the following environment variables in the `lunchmove-env/bin/activate` script. Some of the secret variables you should get from me:

    export DATABASE_URL=postgres://:@localhost/lunchmove_dev1
    export DEBUG=True
    export SECRET_KEY=[generate a Django Secret key]
    export HIPCHAT_ROOM_ID=1934389
    export HIPCHAT_AUTH_TOKEN=[get this from Ben]
    export SLACK_ROOM=test
    export SLACK_URL=[get this from Ben]

Then run the activation script:

    $ source lunchmove-env/bin/activate

Install the dependencies. If this fails on psycipg2, you may need to install libpq, on Mac: `brew install libpqxx`.

    $ pip install -r requirements.txt
    
Some of the python dependencies in requirements.txt might have some issues with installation, in particular cffi and the crpyto things. some of the following might be required to get this working:

    # this installs command line tools on OSX, needed for compiling c libs
    $ xcode-select --install 
    
    # this installs the c libs for ffi, using pkg-config so the appropriate compiler options are automatically used
    $ brew install pkg-config libffi
    
    # and this installs yet another dependency of cffi that pip can't quite seem to do on its own
    $ brew install libpqxx

Create a database. On OSX, I'm using [Postgres.app](http://postgresapp.com/) to manage connecting to the database shell.

    $ CREATE DATABASE lunchmove_dev1;

Migrate your database, create a superuser and run the server:

    $ python manage.py migrate
    $ python manage.py createsuperuser
    $ python manage.py runserver

### Front end dependencies and development:

The front end assets are located in the public/assets folder. Packages are managed via NPM. To install the front end assets, navigate to the folder and run the following commands:

    $ cd static/app
    $ npm install
    $ npm run setup

During development, to recompile the javascript and stylesheets:

    $ gulp build

The compiled javascript and stylesheets are checked into repository, so if you make any changes to them, make sure they've been recompiled before pushing.
