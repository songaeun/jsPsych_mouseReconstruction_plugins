var jsPsychReconstruct_wheel = (function (jspsych) {
  "use strict";

  const info = {
    name: "reconstruct-wheel",
    parameters: {        
      /**
       * The images composing the circular dimension. Use this only when the stimulus_type is 'image'
       */
      image_path: {
        type: jspsych.ParameterType.IMAGE,
        default: undefined,
      },
      image_width: {
        type: jspsych.ParameterType.INT,
        default: 200,
      },
      image_height: {
        type: jspsych.ParameterType.INT,
        default: 200,
      },
      /**
       * Whether the answer to be reconstructed is displayed on the reconstruction display.
       * (This is particularly for perceptual reconstruction task).
       */
      show_answer: {
        type: jspsych.ParameterType.BOOL,
        default: false,
      },
      /**
       * Paramters for answer_image. Declare below three when 'show_answer=true.'
       */
      answer_image: {
        type: jspsych.ParameterType.INT, // in number
        default: null,
      },
      answer_image_width: {
        type: jspsych.ParameterType.INT,
        default: 200,
      },
      answer_image_height: {
        type: jspsych.ParameterType.INT,
        default: 200,
      },
      /**
       * The interval between two adjacent angles on the circle in a degree unit. (e.g. 1deg unit, 2 deg unit, 10 deg unit, etc.)  
       */
      step_size: {
        type: jspsych.ParameterType.INT,
        default: 1,
      },      
      /**
       * Wheter or not the indicator is displayed around the response image.       
       */
      show_indicator: {
        type: jspsych.ParameterType.BOOL,
        default: true,
      },  
      indicator_wheel_diameter:{
        type: jspsych.ParameterType.INT,
        default: 400,
      },     
      indicator_wheel_width:{
        type: jspsych.ParameterType.INT,
        default: 2
      },
      indicator_pointer_radius:{
        type: jspsych.ParameterType.INT,
        default: 4
      },      
      /**
       * The layout of reconstruction display
       * In case when displaying the answer image, you can use 'left', 'right', 'top', 'bottom'
       * The answe image will be presetned in 'right', 'left', 'bottom', 'top' respectively depending on the canvas position.
       */
      canvas_position: {
        type: jspsych.ParameterType.STRING,
        default: 'center'
      },
      answer_position: {
        type:jspsych.ParameterType.STRING,
        default: null
      },
      /**
       * Whether the starting point of the wheel would be randomized.
       */
      random_circle_rotation: {
        type: jspsych.ParameterType.BOOL,
        default: false,
      },
      /**
       * starting value. 
       * By default, for the image wheel, a grey box is set as starting value. 
       * So, please include grey image under the number 99999 
       */
      starting_value: {
        type: jspsych.ParameterType.INT,
        default: 999999
      },
      uncertainty_range: {
        type: jspsych.ParameterType.BOOL,
        default: false
      },
      image_format: { // ex) .jpg, .png, .webp, etc.
        type: jspsych.ParameterType.STRING,
        default: '.jpg'
      }, 
    },
  };

  /**
   * **circular reconstruction**
   *
   * jsPsych plugin for reconstruction task with circular dimension (e.g., orientation, color, etc.)
   *
   * @author Gaeun Son
   * @see {@link https://TBD DOCUMENTATION LINK TEXT}
   */
  class mouseReconstructionPlugin_imageWheel {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {
      this.display = display_element;
      this.params = trial;      
      this.wsp=0;
      if(this.params.random_circle_rotation == true){  // set random rotation angle
        this.wsp = Math.random()*Math.PI; // should be in radian range      
      }    
      console.log(this.wsp/Math.PI*180)
      var initial_param = this.params.starting_value; // initial starting_value
      this.init_display(initial_param);
      this.setup_event_listeners();
      this.start_time = performance.now();
    }
    init_display(img_angle, pointer_angle) {
      this.add_css();
      // image      
      this.img_num = ('000000'+img_angle).slice(-6);
      let canvas_html;
      canvas_html=`<div id="arena_${this.params.canvas_position}">
      <canvas id="recon_canvas" width="${this.params.indicator_wheel_diameter}" height="${this.params.indicator_wheel_diameter}" 
      class="indicator-circle"></canvas>
      <img src="${this.params.image_path}/${this.img_num}.${this.params.image_format}"
      width="${this.params.image_width}" height="${this.params.image_height}"></div>`      
      var answer_html = ``;
      if(this.params.show_answer==true){  
        var answer_img_num =  ('000000'+this.params.answer_image).slice(-6)     
        answer_html=`<div id="arena_${this.params.answer_position}">
        <img src="${this.params.image_path}/${answer_img_num}.${this.params.image_format}" 
        width="${this.params.answer_image_width}" height="${this.params.answer_image_height}"></div>`;
      }
      let display_html;
      display_html=`<div id="base_container">${canvas_html}${answer_html}</div>`
      this.display.innerHTML=display_html;
      this.recon_arena=this.display.querySelector('#recon_canvas');        
      // indicator 
      if(this.params.show_indicator==true){        
        var rect = this.recon_arena.getBoundingClientRect();
        var rel_cx = (rect.width/2)-this.params.indicator_wheel_width; //relative canvas center
        var rel_cy = (rect.height/2)-this.params.indicator_wheel_width;
        var pcx = Math.cos(pointer_angle) * (this.params.indicator_wheel_diameter/2-this.params.indicator_pointer_radius); // pointer center
        var pcy = Math.sin(pointer_angle) * (this.params.indicator_wheel_diameter/2-this.params.indicator_pointer_radius);  
        if (img_angle == 999999){
          pcx = 0; pcy = 0;
        }    
        this.draw_pointer(pcx+rel_cx, pcy+rel_cy, this.params.indicator_pointer_radius, 'black');
      }      
    }
    setup_event_listeners(){
      document.addEventListener("mousemove", this.search_event);
      document.addEventListener("click", this.search_confirm_event);      
    }
    search_event(e){
      this.is_search=true;
      this.angles = this.find_param(e);
      this.init_display(this.angles.img_angle, this.angles.mouse_angle);  
    }
    search_confirm_event(){
      this.search_end = performance.now();
      document.removeEventListener('mousemove', this.search_event);
      // change pointer color
      if(this.params.show_indicator==true){        
        var rect = this.recon_arena.getBoundingClientRect();
        var rel_cx = (rect.width/2)-this.params.indicator_wheel_width; //relative canvas center
        var rel_cy = (rect.height/2)-this.params.indicator_wheel_width;     
        var pcx = Math.cos(this.angles.mouse_angle) * (this.params.indicator_wheel_diameter/2-this.params.indicator_pointer_radius); // pointer center
        var pcy = Math.sin(this.angles.mouse_angle) * (this.params.indicator_wheel_diameter/2-this.params.indicator_pointer_radius);        
        this.draw_pointer(pcx+rel_cx, pcy+rel_cy, this.params.indicator_pointer_radius, 'red');
      } 
      // record data
      this.trial_data={};
      this.trial_data.search_rt = this.search_end - this.start_time;
      this.trial_data.response = this.img_num;
      this.trial_data.mouse_angle = this.angles.mouse_angle;
      this.trial.randrot_angle = this.wsp; 
      this.is_search = false;      
      // call uncertainty rating functions
      if(this.params.uncertainty_range == true) {
        document.addEventListener("mousemove", this.range_event);
        document.addEventListener("click", this.range_confirm_event);              
      } else { // or end this trial
          this.end_trial();  
      }
    }
    range_event(e){
      if(this.is_search == false){              
        document.removeEventListener("click", this.search_confirm_event);
        // canvas info        
        var rect = this.recon_arena.getBoundingClientRect();     
        var canvas_centerX = rect.left + (rect.width/2) - this.params.indicator_wheel_width;
        var canvas_centerY = rect.top + (rect.height/2) - this.params.indicator_wheel_width;             
        // get relative mouseposition in rect
        var x = e.clientX-canvas_centerX;
        var y = e.clientY-canvas_centerY;
        var end_angle = Math.atan2(y, x);          
        var draw_range=(start, one_end) => {
          var rad = this.params.indicator_wheel_diameter/2-4;          
          var ctx = this.recon_arena.getContext("2d");
          var start = (start+Math.PI) % (Math.PI*2) - Math.PI;
          var one_end = (one_end+Math.PI) % (Math.PI*2) - Math.PI;
          this.half_range = Math.abs((one_end - start+Math.PI) % (Math.PI*2) - Math.PI);
          ctx.clearRect(0, 0, this.params.indicator_wheel_diameter, this.params.indicator_wheel_diameter);            
          ctx.beginPath();
          ctx.lineWidth = 5;
          ctx.strokeStyle = 'red';
          ctx.arc(rect.width/2-this.params.indicator_wheel_width, rect.height/2-this.params.indicator_wheel_width, rad, 
            start-this.half_range, start+this.half_range);
          ctx.stroke();
          ctx.closePath();          
        }        
        draw_range(this.angles.mouse_angle, end_angle);        
      }
    }
    range_confirm_event(){
      if(this.is_search == false){
          document.removeEventListener("mousemove", this.range_event);            
          this.trial_data.uncertainty_half_range = this.half_range; 
          this.trial_data.uncertainty_rt = performance.now() - this.search_end; // need to figure out        
          this.end_trial();            
      } 
    }
    find_param(e){
      // get mouseposition relative to canvas center
      var rect = this.recon_arena.getBoundingClientRect();    
      var canvas_centerX = rect.left + (rect.width/2) - this.params.indicator_wheel_width;
      var canvas_centerY = rect.top + (rect.height/2) - this.params.indicator_wheel_width;      
      var x = e.clientX-canvas_centerX;
      var y = e.clientY-canvas_centerY;
      // convert to angles
      var angles =[];
      angles.mouse_angle = Math.atan2(y, x); // range: -pi to pi
      angles.rotated_angle = angles.mouse_angle - this.wsp; // min: -2+pi (max this.wsp = pi)
      angles.rotated_angle_wrap = (angles.rotated_angle + (Math.PI*2)) % (Math.PI*2) // range: 0 ~ 2*pi
      angles.rotated_angle_deg = angles.rotated_angle_wrap/Math.PI * 180; 
      angles.img_angle = Math.floor(angles.rotated_angle_deg/this.params.step_size);       
      console.log(angles);
      return angles;
    }
    draw_pointer(xx, yy, radius, color){
      var ctx = this.recon_arena.getContext("2d");        
      ctx.clearRect(0, 0, this.params.indicator_wheel_diameter, this.params.indicator_wheel_diameter);            
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(xx, yy, radius, 0, Math.PI*2);
      ctx.fill();
      ctx.closePath();
    }
    end_trial(){
      document.removeEventListener("click", this.search_confirm_event);
      document.removeEventListener("mousemove", this.search_event);
      document.removeEventListener("mousemove", this.range_event);
      document.removeEventListener("click", this.range_confirm_event);
      this.display.innerHTML = "";
      document.querySelector("#recon-wheel-styles").remove();
      this.jsPsych.finishTrial(this.trial_data);
    }
    add_css (){
      document.querySelector("head").insertAdjacentHTML("beforeend", `<style id="recon-wheel-styles"> 
        #base_container {                
            position: relative;
            margin: auto;              
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            width: 1000px;
            height: 800px;                
            display: flex;
            align-items: center;                
            // border: 1px solid black;
        }            
        /** When using entire container space */
        #arena_center {   
            position: absolute;                           
            width: 100%;
            height: 100%;
            display: flex; 
            align-items: center;
            justify-content: center;                                      
        }            
        /** When dividing the container into 2 VERTICALLY*/
        #arena_left { 
            position: absolute;                        
            left: 0;             
            width: 50%;
            height: 100%;  
            display: flex;
            align-items: center;
            justify-content: center;                 
        }
        #arena_right {                 
            position: absolute;                 
            right: 0;                  
            width: 50%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;     
        }            
        /** when dividing the container into 2 HORIZONTALLY */
        #arena_top {
            position: absolute;                        
            top: 0;             
            width: 100%;
            height: 50%;  
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #arena_bottom {
            position: absolute;                        
            top: 50%;             
            width: 100%;
            height: 50%;  
            display: flex;
            align-items: center;
            justify-content: center;
        }            
        /** When dividing the container into 3x3 sections*/
        #arena_TL { 
            position: absolute;
            top: 0; /** why 6.6...??? */                       
            left: 0;
            width: 33.3%;
            height: 33.3%;  
            display: flex;
            align-items: center;
            justify-content: center;                  
        }
        #arena_TM {                 
            position: absolute;                 
            left: 33.3%;
            top: 0;                                  
            width: 33.3%;
            height: 33.3%;
            display: flex;
            align-items: center;
            justify-content: center; 
        }
        #arena_TR {                 
            position: absolute;                 
            right: 0;
            top: 0;                                  
            width: 33.3%;
            height: 33.3%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #arena_ML {                 
            position: absolute;                 
            left: 0;
            top: 33.3%;                                  
            width: 33.3%;
            height: 33.3%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #arena_MM {                 
            position: absolute;                 
            left: 33.3%;
            top: 33.3%;                                  
            width: 33.3%;
            height: 33.3%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #arena_MR {                 
            position: absolute;                 
            right: 0;
            top: 33.3%;                                  
            width: 33.3%;
            height: 33.3%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #arena_BL {  
            position:absolute;              
            bottom: 0;
            left: 0;
            width: 33.3%;
            height: 33.3%;
            display: flex;
            align-items: center;
            justify-content: center;            
        }
        #arena_BM {                 
            position: absolute;                 
            left: 33.3%;
            top: 66.6%;                                  
            width: 33.3%;
            height: 33.3%;
            display: flex;
            align-items: center;
            justify-content: center; 
        }
        #arena_BR {
            position: absolute;               
            bottom: 0;
            right: 0;
            width: 33.3%;
            height: 33.3%;
            display: flex;
            align-items: center;
            justify-content: center;              
        }           
        #recon_canvas {              
            position: absolute;
            width: ${this.params.indicator_wheel_diamter}px;
            height: ${this.params.indicator_wheel_diameter}px;
            display: flex; 
            align-items: center;
            justify-content: center;               
            transform-origin: center center;   
            border: ${this.params.indicator_wheel_width}px solid;
        }  
        .indicator-circle{
            border-radius: ${this.params.indicator_wheel_diameter/2}px;
        }
        </style>`
      );
    };
  }
  mouseReconstructionPlugin_imageWheel.info = info;

  return mouseReconstructionPlugin_imageWheel;

})(jsPsychModule);