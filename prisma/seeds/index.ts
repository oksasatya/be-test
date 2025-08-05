import {seedAdmin} from "./seedAdmin";
import { prisma } from "../../src/utils/prisma.utils";

async function seed(){
    // Seed Function Call Goes Here
   await seedAdmin(prisma)
}

seed().then(()=>{
    console.log("ALL SEEDING DONE")
})