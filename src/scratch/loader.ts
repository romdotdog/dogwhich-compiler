import fs from "fs";
import {
  scratchProject,
  scratchSprite,
  scratchStage,
  scratchTarget,
} from "./structure";
export const Project: scratchProject = JSON.parse(
  fs.readFileSync("./ex/fns/project.json").toString()
);
// console.log(Project.targets[0].blocks[`tSw^g0JT+.gJ9z/MAzJ!`].inputs);
// console.log(Project.targets[0].blocks["`0v2-l9%%~07#FAsP3*b"]);
// console.log(Project.targets[0].blocks["^t=H!_p;XM-x?b5=@P~%"]);
