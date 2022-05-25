let x = 0;

import { Token, Tokenizer } from "./tokenizer";
import { Parser } from "./parser";
import { Compile } from "./comp";
import { saveProject } from "./scratch/zipping";
import { Project } from "./scratch/loader";
const newLocal = `
sprite main { 
    loc x;
    loc y;
    loc vx; 
    loc vy;
    loc return;
    loc list myList;
    loc listPointer;
    loc listLength;
    loc list log;
    loc list lines;
    loc  linePointer;
    loc lcounter;
    func newVector(x,y){
      this.myList.push(x);
      this.myList.push(y);
      this.listPointer=this.listPointer+2;
      ret this.listPointer-2;
    }
    func addLine(x1,x2,x3,x4){
      let v1= this.newVector(x1,x2);
      let v2=  this.newVector(x3,x4);
      this.lines.push(v1);
      this.lines.push(v2);
      this.linePointer = this.linePointer+2;
      ret this.linePointer-2;
    }
    func drawAllLines(){
      let i=0;
      
      repeat ((this.linePointer-1)/2) {
        this.drawLine(this.lines[(i*2)+1],this.lines[(i*2)+2]);
        i=i+1;
      }
    }
    func checkAllLines(position,velocity,out){
      let i=0;
      let m=0;
      
      repeat ((this.linePointer-1)/2) {
        
        
        m= this.isCollidingWithLine(this.lines[(i*2)+1] , this.lines[(i*2)+2], position,20);
      if((m>0)|(m<0)){
        let vrf = math.abs(m)/math.sqrt((this.myList[velocity]*this.myList[velocity])+(this.myList[velocity+1]*this.myList[velocity+1]));
     
        let dot = -2*((this.myList[velocity]*this.myList[out])+(this.myList[velocity+1]*this.myList[out+1]));
        
let f1= ((math.abs(this.myList[out])/this.myList[out])==(math.abs(this.myList[velocity])/this.myList[velocity]));
let f2 = ((math.abs(this.myList[out+1])/this.myList[out+1])==(math.abs(this.myList[velocity+1])/this.myList[velocity+1]));

        if((f1&&(!f2))|(f2&&(!f1))) {

          dot = dot * -1;
          this.myList[position]=this.myList[position]-(this.myList[out]*m);
          this.myList[position+1]=this.myList[position+1]-(this.myList[out+1]*m);
        }
        else {
          // this.say("c2"~m);
          this.myList[position]=this.myList[position]+(this.myList[out]*m);
          this.myList[position+1]=this.myList[position+1]+(this.myList[out+1]*m);
        }
        if(m<0) {
          dot=dot*-1;
        }
        
        this.myList[velocity]=(this.myList[velocity]+(dot*this.myList[out]))/3;
        this.myList[velocity+1]=(this.myList[velocity+1]+(dot*this.myList[out+1]))/3;
        
        
        
        
        
        i=i+1;
      }
    }  
    }
    
    func addVector(vecOne,vecTwo,returnTo) {
      let newX = this.myList[vecOne]+this.myList[vecTwo];
      let newY =  this.myList[vecOne+1]+this.myList[vecTwo+1];
      
      this.myList[returnTo]=newX;
      this.myList[returnTo+1]=newY;
     
      
    }
    func sayVector(vec){
      scratch.say("X is: ");
      scratch.say(this.myList[vec]);
      scratch.say("Y is: ");
      scratch.say(this.myList[vec+1]);
    }
    func moveTo(vector){
      scratch.moveTo(this.myList[vector],this.myList[vector+1]);
    }
    func say(value){
      this.log.push(value);
      ret scratch.ask(value~" (enter to continue)");
    }
    func calcNormal(v1,v2,o){
      let r1 = (this.myList[v1]-this.myList[v2]);
      let r2= (this.myList[v1+1]-this.myList[v2+1]);
     
    
      let m =math.sqrt((r1*r1)+(r2*r2));

      this.myList[o]=r1/m;
      this.myList[o+1]=-m/r2;
    }
    func isCollidingWithLine(linePointOne,linePointTwo,bVector,Width){
      let d1 = math.sqrt(((this.myList[linePointOne+1]-this.myList[bVector+1])*(this.myList[linePointOne+1]-this.myList[bVector+1]))+((this.myList[linePointOne]-this.myList[bVector])*(this.myList[linePointOne]-this.myList[bVector])));

      let d2 = math.sqrt(((this.myList[linePointTwo+1]-this.myList[bVector+1])*(this.myList[linePointTwo+1]-this.myList[bVector+1]))+((this.myList[linePointTwo]-this.myList[bVector])*(this.myList[linePointTwo]-this.myList[bVector])));
      let l = math.sqrt(((this.myList[linePointTwo+1]-this.myList[linePointOne+1])*(this.myList[linePointTwo+1]-this.myList[linePointOne+1]))+((this.myList[linePointTwo]-this.myList[linePointOne])*(this.myList[linePointTwo]-this.myList[linePointOne])));

      let w1 = ((((d1*d1)-(d2*d2))/l)+l)/2;
      let d= math.sqrt((d1*d1)-(w1*w1));
      let f=0;
      if((d<Width)&&((d1<l)&&(d2<l))){
          f=  ((this.myList[linePointOne+1]-this.myList[linePointTwo+1])/(this.myList[linePointOne]-this.myList[linePointTwo]))*(this.myList[linePointOne]-this.myList[bVector]);
         if(f<this.myList[bVector+1]){
          ret Width-d;
          }
         else{
           ret Width-d;
         }
        
      }      
      else {
        ret 0;
      }
    }
    func constructor(){
        scratch.show();
        scratch.hide();
        let name = scratch.ask("Hello adventurer! What should we call you?");
        let options = scratch.ask("We're offering a special-void deal today! Do you want to hear it? (y/n)");
        let an = "";
        if((options=="n")|(options=="no")){
          this.say("Too bad "~name~". I'm going to tell it you anyway.");
          this.say("Option one: Lazer.");
          this.say("Option two: Lazer.");
          this.say("Option three: Lazer.");
          an=  scratch.ask("Ok, we only have lazers. Too many lazers. Ok we're just giving you a lazer. Here, take it : ");
        }
        
        this.listPointer=1;
        this.listLength=0;
        this.linePointer=1;
        this.x=0;
        this.y=0;
        this.vx=0;
        this.vy=0;
        let position = this.newVector(0,0);
        let velocity = this.newVector(-2,0);
        let acc = 1*(-9.81/600);
        scratch.penDown();
        
        let myVec = this.newVector(40,-150);
        let mySecondVec = this.newVector(0,0);
        let out = this.newVector(0,0);
        this.calcNormal(myVec,mySecondVec,out);
        let m=0;
        this.addLine(20,30,90,90);
        forever {
        scratch.wait(0.0001);
        scratch.penClear();
        this.drawLine(myVec , mySecondVec);
        
        this.drawAllLines();
        
        scratch.setPenSize(40);
        
        repeat (1){
         m= this.isCollidingWithLine(myVec , mySecondVec, position,20);
        if((m>0)|(m<0)){
          let vrf = math.abs(m)/math.sqrt((this.myList[velocity]*this.myList[velocity])+(this.myList[velocity+1]*this.myList[velocity+1]));
       
          let dot = -2*((this.myList[velocity]*this.myList[out])+(this.myList[velocity+1]*this.myList[out+1]));
          if(((math.abs(this.myList[out])/this.myList[out])==(math.abs(this.myList[velocity])/this.myList[velocity]))|((math.abs(this.myList[out+1])/this.myList[out+1])==(math.abs(this.myList[velocity+1])/this.myList[velocity+1]))) {
            // this.say("c1"~m);
            dot = dot * -1;
            this.myList[position]=this.myList[position]-(this.myList[out]*m);
            this.myList[position+1]=this.myList[position+1]-(this.myList[out+1]*m);
          }
          else {
            // this.say("c2"~m);
            this.myList[position]=this.myList[position]+(this.myList[out]*m);
            this.myList[position+1]=this.myList[position+1]+(this.myList[out+1]*m);
          }
          
          
          this.myList[velocity]=(this.myList[velocity]+(dot*this.myList[out]))/3;
          this.myList[velocity+1]=(this.myList[velocity+1]+(dot*this.myList[out+1]))/3;
          
          
          
          
          this.calcNormal(myVec,mySecondVec,out);
       
        }
    this.checkAllLines(position,velocity,out);
          this.addVector(position,velocity,position);

        
        scratch.penUp();
        this.moveTo(position);
        scratch.penDown();
        this.moveTo(position);
        scratch.penUp();
       
      }
      
        scratch.say(position);
        this.myList[velocity+1]=this.myList[velocity+1]+acc;
        if(scratch.keyIsPressed("left arrow")){
          this.myList[velocity]=this.myList[velocity]-0.1;

        }
        if(scratch.keyIsPressed("a")){

        }
        else if(scratch.keyIsPressed("right arrow")){
          this.myList[velocity]=this.myList[velocity]+0.1;
        }
        else if(scratch.keyIsPressed("up arrow")){
          this.myList[velocity+1]=this.myList[velocity+1]+0.4;
        }
        if((this.myList[position+1]<-150)|(this.myList[position+1]>170)){
          this.myList[velocity+1]=-this.myList[velocity+1]/2;
          this.addVector(position,velocity,position);

      

        } 
        if((this.myList[position]<-200)|(this.myList[position]>200)){
          this.myList[velocity]=-this.myList[velocity];
          this.addVector(position,velocity,position);
        } 
      }
       
    }

  
    func repeatntimes(e){
      let old = e;
      ret old;
    }

    func moveforeward(x){
        let y = x+10;

        ret;
    }

    func drawLine(vecone,  vectwo){
      scratch.setPenSize(1);
      scratch.penUp();
      this.moveTo(vecone);
      scratch.penDown();
      this.moveTo(vectwo);
      scratch.penUp();
    }

};

`;
let parser = new Parser(new Tokenizer(newLocal));
let tlv = parser.parseTopLevelStatement();
console.log(tlv.functions[1].statements);
Project.targets[1] = Compile(tlv);
//@ts-expect-error
Project.monitors = [];
saveProject(JSON.stringify(Project));

// console.log(parser.parseTopLevelStatement());
// import "./scratch";
