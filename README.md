# JwvGettingStarted

## general structure of this tutorial ##
If you want to just use the latest commit as is, you are very welcome to do so :)

However, if you search for a step-by-step tutorial, we structured this git project 
so that every commit adds some more functionality so hopefully if you look at the 
git commit history, each step is more digestible than the entire project. 

the commits in the next chapter "commit history" are ordered from top to bottom from the most recent 
to the least recent time of the commit. If you want to set up your angular project on your own, 
you can skip e.g. the most bottom 4 commits as they only explain exactly that without making any use of 
the jadice web viewer. Those oldest 4 commits also contribute to the Tutorial 000, while the more recent
commits contribute to the "real beef" in tutorial 001. 

So at the end of tutorial 000, we will only have a dummy website talking to a dummy server.
At the end of tutorial 001, we will have a running jadice web viewer demo that is able to render documents
and that has many features like thumbnails, printing and annotations.
At the end of tutorial 002, we additionally show how to load and save annotations against an external storage endpoint protected by basic authentication.



### the current commit: ###
added functionality
* updated the tutorial setup to Angular 20 dependencies.
* added tutorial-002 with annotation loading and saving (including demo storage server setup).

### previous commits: ###
please check the README.md of that specific commit


## how to run this commit ##

### tutorial-001
The client should be set up like described in the commit "install all necessary dependencies for the client".
For the server, run `org.jadice.jwv.tutorial.JadiceWebViewerApplication001` as spring boot application with the classpath set to the subfolder `tutorial-001/server` of this project.
After that, navigate to `http://localhost:4200`.

### tutorial-002 (annotation loading and saving)
1. Start the demo annotation storage server:
   `cd tutorial-002/test-server-basic-auth`
   `npm i`
   `node static-server.js --port 3000 --dir ./public --auth --username user1 --password test`
2. Run `org.jadice.jwv.tutorial.JadiceWebViewerApplication002` from `tutorial-002/server` as spring boot application.
3. Start the Angular client:
   `cd tutorial-002/client`
   `npm i`
   `npm start`
4. Open `http://localhost:4200`, add or edit an annotation, click save (top toolbar or menu), then reload the app to verify persistence.
   The repo ships an initial `tutorial-002/test-server-basic-auth/public/test93.xml`, so annotation loading works on first run.

Detailed tutorial-002 notes are in `tutorial-002/README.md`.
