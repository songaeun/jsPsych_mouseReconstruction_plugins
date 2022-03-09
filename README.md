# Mouse reconstruction plugins for jsPsych
This repository contains two jsPsych custom plugins ('plugin-reconstruct-2D' & 'plugin-reconstruct-circle') where participants can reconstruct their responses by adjusting the mouse position in the continuous probe space.
You can also record 'confidence intervals' of the responses after participants finalize their initial reconstruction responses. 

## Plugin-reconstruction-2D
This plugin allows a participant to interact with a stimulus by moving the mouse position inside of the "2 dimensional" stimulus space. 
Participants can explore the probe space area by moving the mouse pointer, and the image on the left will change along with the mouse position. 
If the mouse goes outside the probe space, the left image will be greyed out. To respond, they can just click on the space.

### Demo
![](docs/demo-plugin-reconstruct-2D.gif)

### Stimulus Praparation
To use this plugin, you need to prepare an image set that consists of your stimulus space. 
For example, if your stimulus space is 25 x 25 (vertical x horizontal step sizes), a total of 625 images should be prepared and indexed properly from 000000 ~ 000625. 
The indices of the images start from top-left of the space and move along the vertical direction. Note that each image should be named with its index with leading zeroes of 6 (e.g., top-left image: 000000.jpg).  


## Plugin-reconstruction-circle
This plugin allows a participant to interact with a stimulus by moving the mouse position along a "circular" stimulus space.

![](docs/demo-plugin-reconstruct-circle.gif)





