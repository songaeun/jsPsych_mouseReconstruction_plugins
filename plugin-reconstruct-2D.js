var jsPsychReconstruct_2D = (function (jspsych) {    
  'use strict';

  const info = {
      name: "reconstruct-2D",
      parameters: {          
          /** The position of image & indicator space 
           * For 'left-right' layout, in can be chosen from ['left','right']
           * For 'up-down' layout, it can be chosen from ['top','bottom']
           * For '3 by 3 grid' layout, it can be chosen from ['TL','TM','TR'; 'ML','MM','MR';'BL','BM','BR']
           * (see details: URL).
          */           
          image_position: {
              type: jspsych.ParameterType.STRING,
              default: 'left'
          },          
          canvas_position: {
              type: jspsych.ParameterType.STRING,
              default: 'right'
          },
          /** The step size of the space dimensions */
          horizontal_step_size: {
              type: jspsych.ParameterType.INT,
              default: undefined,
          },
          vertical_step_size: {
            type: jspsych.ParameterType.INT,
            default: undefined,
          },                    
          /** Image parameters */
          image_path: {
              type: jspsych.ParameterType.STRING,
              default: undefined,
          },
          image_width: {
              type: jspsych.ParameterType.INT,
              default: 300
          },
          image_height: {
              type: jspsych.ParameterType.INT,
              default: 300
          },          
          image_format: { // ex) jpg, png, webp, etc.
              type: jspsych.ParameterType.STRING,
              default: 'jpg'
          },   
          starting_value: { // initial image number when starting plugin
              type: jspsych.ParameterType.INT,
              default: 999999 // grey image
          }, 
          /** Canvas paramters */    
          canvas_shape: {
              type: jspsych.ParameterType.STRING,
              default: 'rectangle'
          },   
          canvas_width: {
              type: jspsych.ParameterType.INT,
              default: 300
          },
          canvas_height: {
              type: jspsych.ParameterType.INT,
              default: 300
          },
          canvas_diameter: {
              type: jspsych.ParameterType.INT,
              default: 300
          },         
          canvas_border_width: {
              type: jspsych.ParameterType.INT,
              default: 1,
          },          
          /** Parameters for uncertainty range 
           * reference: Popos & Oberauer (2021)
           */  
          uncertainty_range: {
              type: jspsych.ParameterType.BOOL,
              default: false,
          },
          range_type: {
              type: jspsych.ParameterType.STRING,
              default: 'circle', // or 'ellipse'
          },
      },
  };
  /**
   * ** mouse-reconstruction-2D **
   *
   * jsPsych plugin for the reconstruction task using mouse in 2-dimensional stimulus space.
   *
   * @author Gaeun Son 
   * @see {@link URL}
   */
  class Reconstruction2DPlugin {
      constructor(jsPsych) {
          this.jsPsych = jsPsych;
      }     
      trial(display_element, trial) {    
          this.display = display_element;
          this.params = trial;              
          var image_param = this.params.starting_value; // initial_param      
          this.init_display(image_param);
          this.setup_event_listeners(); 
          this.start_time = performance.now();                   
      }
      init_display(image_param){
          this.add_css();
          let canvas_html;
          if(this.params.canvas_shape=="rectangle"){
              canvas_html=`<div id="arena_${this.params.canvas_position}">
              <canvas id="recon_canvas" width="${this.params.canvas_width}" height="${this.params.canvas_height}" 
              class="recon2D-rectangle"></canvas></div>`;
          }else if(this.params.canvas_shape=="circle"){
              canvas_html=`<div id="arena_${this.params.canvas_position}">
              <canvas id="recon_canvas" width="${this.params.canvas_diameter}" height="${this.params.canvas_diameter}" 
              class="recon2D-circle"></canvas></div>`;
          }else{
              throw new Error('`canvas_shape` parameter must be either "rectangle" or "circle"');
          }
          let image_html;
          image_html=`<div id="arena_${this.params.image_position}">
          <img src="${this.params.image_path}/${image_param}.${this.params.image_format}" 
          width="${this.params.image_width}" height="${this.params.image_height}"></div>`;
          let display_html;
          display_html = '<div id="base_container">'+ canvas_html + image_html + '</div>';
          this.display.innerHTML = display_html;      
          this.recon_arena = this.display.querySelector("#recon_canvas");      
      }
      setup_event_listeners() {          
          document.addEventListener("mousemove", this.search_event);
          document.addEventListener("click", this.search_confirm_event);               
      }      
      search_event (e) {
          this.is_search = true;
          this.image_coord = this.find_param(e.clientX,e.clientY);  
          this.image_param = ("000000"+this.image_coord).slice(-6);  
          this.init_display(this.image_param);                                
      }      
      search_confirm_event (e) {
          this.search_end = performance.now();
          document.removeEventListener('mousemove', this.search_event);          
          this.trial_data={};
          this.trial_data.search_rt = this.search_end - this.start_time;
          this.trial_data.response = this.image_param;  
          this.is_search = false;
          // mark the response
          var rect = this.recon_arena.getBoundingClientRect();  
          this.init_x = e.clientX - rect.left;
          this.init_y = e.clientY - rect.top;
          var ctx = this.recon_arena.getContext("2d");
          ctx.clearRect(0, 0, this.params.canvas_width, this.params.canvas_height);            
          ctx.beginPath();
          ctx.arc(this.init_x, this.init_y, 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.closePath();  
          // call uncertainty rating functions
          if(this.params.uncertainty_range == true) {
              document.addEventListener("mousemove", this.range_event);
              document.addEventListener("click", this.range_confirm_event);              
          } else { // or end this trial
              this.end_trial();  
          }
      }
      end_trial(){
          document.removeEventListener("click", this.search_confirm_event);
          document.removeEventListener("mousemove", this.search_event);
          document.removeEventListener("mousemove", this.range_event);
          document.removeEventListener("click", this.range_confirm_event);
          this.display.innerHTML = "";
          document.querySelector("#recon2D-styles").remove();
          this.jsPsych.finishTrial(this.trial_data);
      }
      range_event (e){          
          if(this.is_search == false){              
            document.removeEventListener("click", this.search_confirm_event);
            var rect = this.recon_arena.getBoundingClientRect();           
            var draw_circle=(rad) => {
                var ctx = this.recon_arena.getContext("2d");
                ctx.clearRect(0, 0, this.params.canvas_width, this.params.canvas_height);            
                ctx.beginPath();
                ctx.fillStyle = 'lightgrey';
                ctx.arc(this.init_x, this.init_y, rad, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();
            }            
            var mx = e.clientX - rect.left;
            var my = e.clientY - rect.top;            
            this.uncertain_rad = Math.sqrt(Math.pow((mx-this.init_x), 2) + Math.pow((my-this.init_y),2))
            draw_circle(this.uncertain_rad);        
          }
      }   
      range_confirm_event (){          
          if(this.is_search == false){
            //   this.display.innerHTML = "";
              document.removeEventListener("mousemove", this.range_event);
            //   document.querySelector("#recon2D-styles").remove();      
              this.trial_data.uncertainty_radius = this.uncertain_rad; 
              this.trial_data.uncertainty_rt = performance.now() - this.search_end; // need to figure out            
              this.end_trial();            
          }          
      }   
      find_param (mouse_x, mouse_y) {
          //prepare cell coordinate: "x_y"
          var cell_coordinates = [];
          for(var y=0; y<this.params.vertical_step_size; y++){
              for(var x=0; x<this.params.horizontal_step_size; x++){
                  cell_coordinates.push(x+"_"+y)
              }
          };        
          var find_coord=(mouse_position, reference_point, dimension_size, cell_size)=>{
            for(var i=0; i<dimension_size; i++){
                if(mouse_position>=reference_point+cell_size*i && mouse_position<reference_point+cell_size*(i+1)) {                                  
                    return i;
                }               
            }            
          };
          // get canvas info
          var rect = this.recon_arena.getBoundingClientRect();
          var hori_dim_size = this.params.horizontal_step_size;
          var hori_cell_size = this.params.canvas_width/this.params.horizontal_step_size;
          var vert_dim_size = this.params.vertical_step_size;
          var vert_cell_size = this.params.canvas_height/this.params.vertical_step_size;
          // find coordinates
          var x_coord = find_coord(mouse_x, rect.left, hori_dim_size, hori_cell_size);
          var y_coord = find_coord(mouse_y, rect.top, vert_dim_size, vert_cell_size);
          var coord_idx = cell_coordinates.indexOf(x_coord+'_'+y_coord);
          console.log(coord_idx)
          // when mouse positioned outside of rectangle space
          if (coord_idx == -1){
              coord_idx = 999999;
          }
          // when mouse positioned outside of circle space
          var cx = rect.left+(rect.width/2);
          var cy = rect.top+(rect.height/2);
          var dist_mouse_from_center = Math.sqrt((mouse_x-cx)**2+(mouse_y-cy)**2);
          if(this.params.canvas_shape =='circle'){
            if (dist_mouse_from_center > this.params.canvas_width/2){
                coord_idx = 999999;
            }
          }               
          return coord_idx;
      };          
      add_css (){
        document.querySelector("head").insertAdjacentHTML("beforeend", `<style id="recon2D-styles"> 
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
            //   border: 1px solid black;
          }            
          /** When using entire container space */
          #arena_all {   
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
              width: ${this.params.canvas_width}px;
              height: ${this.params.canvas_height}px;
              display: flex; 
              align-items: center;
              justify-content: center;               
              transform-origin: center center;   
              border: ${this.params.canvas_border_width}px solid;
          }  
          .recon2D-circle{
              border-radius: ${this.params.canvas_diameter/2}px;
          }</style>`
          );
    }; 
  }
  Reconstruction2DPlugin.info = info;

  return Reconstruction2DPlugin;

})(jsPsychModule);
