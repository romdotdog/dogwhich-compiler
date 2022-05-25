import zip from "jszip";
import fs from "fs";
import { writeFile } from "fs/promises";
export function saveProject(p: string) {
  let r = new zip();
  let sb3 = fs.readFileSync("./ex/bbn.zip");

  r.loadAsync(sb3).then(async (e) => {
    e.file("project.json", p);

    fs.writeFileSync(
      "./ex/dist/project.sb3",
      await e.generateAsync({ platform: "UNIX", type: "uint8array" })
    );
    await writeFile("./out/project.json", p);
    // console.log(JSON.parse(await e.files["project.json"].async("string")));
  });
}
