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



### the current commit: ###
added functionality
* annotations
* thumbnail view
* enhanced open file dialogue
* simple reading mode

### previous commits: ###
please check the README.md of that specific commit


## how to run this commit ##
The client should be set up like described in the previous commit.
For the server, run org.jadice.jwv.tutorial.JadiceWebViewerApplication001 as spring boot application with the classpath set to the subfolder tutorial-001/server of this project. 
After that, you need to navigate to localhost:4200 as final step.
