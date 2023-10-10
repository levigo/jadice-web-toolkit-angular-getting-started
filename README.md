# JwvGettingStarted

Steps in this commit: install the client-side jadice dependencies

**Prerequisites**
* first of all, you need to have an npm account. An already existing mvn account at the jadice nexus will most probably not suffice.
* To create one, create a ticket at https://levigo.de/support/ or send an email to jadice-support@levigo.de
* After the account is setup, you neet to login to via npm, so that a .npmrc file will be created in your user directory on your operating system.
    * ```npm login https://artifacts.jadice.com/repository/npm-group```

After this is done, the content of the .npmrc should look something like:
```
registry=https://artifacts.jadice.com/repository/npm-group
//artifacts.jadice.com/repository/:_authToken=<your_generated_token>
```

**Changes done in this commit**
* the necessary dependency settings were applied to the package.json
* all dependencies were updated (we maintain this tutorial, so from time to time we need to increase the version to a somehow current state)
* After editing the package.json and after setting up the auth token like described before, we made an ``npm install``

**Test if all is setup**
* create the auth token like described above
* on this commit:
* go the folder tutorial-001/client
* run ``npm install`` on your machine
* run ``npm run build``
* run ``npm run start``
* on ``localhost:4200`` you should now see the same results as at the end of tutorial 000 (dummy web page), 
       only that now you have already installed all necessary jadice dependencies.
